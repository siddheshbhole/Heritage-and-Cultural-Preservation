"""Intelligent heritage search engine.

Deterministic, intent-aware retrieval across the platform's existing
PostgreSQL / SQLite tables. Implements:

  * Synonym & normalization dictionaries (fort <-> fortress, temple <->
    mandir, buddhist <-> buddhism, mh <-> maharashtra, vishnu <-> vaishnav).
  * Intent & entity extraction (state, city, category, religion, period).
  * Weighted relevance scoring with transparent ``match_reasons``.
  * Token-based fuzzy (Levenshtein) matching for misspelling tolerance.
  * Dynamic "Did you mean?" fallback suggestions on low / no results.
"""
from __future__ import annotations

import difflib
import re
from dataclasses import dataclass, field

from sqlalchemy.orm import Session

from .models import (
    Author, City, Commemoration, Document, Event, HeritageSite, Museum,
    Publication, State,
)

# ---------------------------------------------------------------------------
# Scoring weights (from the relevance model spec)
# ---------------------------------------------------------------------------
W_EXACT_NAME = 100.0
W_ALT_NAME = 90.0
W_COMBO = 85.0
W_CATEGORY = 75.0
W_GEO = 70.0
W_PERIOD = 65.0
W_TEXT = 30.0
W_GENERIC = 12.0

# ---------------------------------------------------------------------------
# Normalization helpers
# ---------------------------------------------------------------------------
STOPWORDS = {
    "in", "to", "near", "the", "a", "an", "and", "of", "at", "for", "with",
    "on", "about", "best", "what", "where", "find", "list", "famous",
    "top", "all", "show", "me", "please", "is", "are", "do", "does",
}

_WORD_RE = re.compile(r"[^\w ]", re.UNICODE)


def normalize(text: str | None) -> str:
    """Lowercase a string, dropping punctuation but keeping unicode letters."""
    if not text:
        return ""
    return _WORD_RE.sub(" ", text.lower())


def tokenize(text: str | None) -> list[str]:
    """Split normalised text into non-stopword tokens."""
    return [t for t in normalize(text).split() if t and t not in STOPWORDS]


def phrase_tokens(phrase: str) -> set[str]:
    return set(tokenize(phrase))


# ---------------------------------------------------------------------------
# Synonym dictionaries
# ---------------------------------------------------------------------------
# Canonical category -> phrase aliases (multi-word aliases allowed)
CATEGORY_ALIASES: dict[str, list[str]] = {
    "Fort": ["fort", "forts", "fortress", "fortresses", "killa", "qila", "garh", "durga"],
    "Temple": ["temple", "temples", "mandir", "shrine", "shrines", "devalaya", "kovil",
               "koil", "gudi", "temple-town"],
    "Cave": ["cave", "caves", "gufa", "rock cut", "rock-cut", "rock cut caves"],
    "Palace": ["palace", "palaces", "mahal", "haveli", "havelis", "wada", "durbar"],
    "Monument": ["monument", "monuments", "memorial", "minar", "tower"],
    "Tomb": ["tomb", "tombs", "mausoleum", "maqbara", "dargah", "tomb-garden"],
    "Mosque": ["mosque", "mosques", "masjid"],
    "Stupa": ["stupa", "stupas", "stupa complex", "chorten"],
    "Museum": ["museum", "museums", "sangrahalaya", "gallery", "galleries"],
    "Dance": ["dance", "dances", "nritya", "nrittya", "classical dance"],
    "Music": ["music", "sangeet", "folk song", "song", "songs", "raga"],
    "Craft": ["craft", "crafts", "handicraft", "handicrafts", "pottery", "weaving",
              "textile", "textiles", "embroidery", "sculpture", "painting", "artisan",
              "art craft"],
    "Manuscript": ["manuscript", "manuscripts", "pandulipi", "palm leaf"],
    "UNESCO": ["unesco", "world heritage", "world heritage site", "heritage site"],
    "Natural": ["national park", "national parks", "sanctuary", "wildlife", "reserve",
                "forest", "nature", "wetland", "wetlands", "lagoon", "delta", "lake",
                "biodiversity"],
    "Archaeological": ["archaeological", "excavation", "excavations", "ruins"],
    "Architecture": ["architecture", "architectural", "building", "buildings"],
    "Heritage": ["heritage", "sites", "site", "places", "place", "attractions",
                 "attraction", "monuments", "landmark", "landmarks", "things"],
}

CATEGORY_BADGE = {
    "Fort": "Fort", "Temple": "Temple", "Cave": "Cave", "Palace": "Palace",
    "Monument": "Monument", "Tomb": "Tomb", "Mosque": "Mosque", "Stupa": "Stupa",
    "Museum": "Museum", "Dance": "Dance", "Music": "Music", "Craft": "Craft",
    "Manuscript": "Manuscript", "UNESCO": "UNESCO", "Natural": "Natural",
    "Archaeological": "Archaeological", "Architecture": "Architecture",
    "Heritage": "Heritage",
}

# Canonical religion -> aliases
RELIGION_ALIASES: dict[str, list[str]] = {
    "Buddhist": ["buddhist", "buddhism", "buddha", "buddhists", "theravada",
                 "mahayana", "sangha", "jataka"],
    "Hindu": ["hindu", "hinduism", "hindu", "vaishnav", "vaishnavism", "vishnu",
              "shaiv", "shaivism", "shiva", "sanatan", "vedic", "deities", "temple town"],
    "Jain": ["jain", "jainism", "jaina", "tirthankara"],
    "Islamic": ["islamic", "islam", "muslim", "sufi", "sufism", "quranic", "dargah",
                "mosque", "masjid", "char bagh"],
    "Sikh": ["sikh", "sikhism", "gurudwara", "gurdwara"],
    "Christian": ["christian", "christianity", "church", "basilica", "cathedral",
                  "gothic church"],
}

RELIGION_BADGE = {
    "Buddhist": "Buddhist", "Hindu": "Hindu", "Jain": "Jain", "Islamic": "Islamic",
    "Sikh": "Sikh", "Christian": "Christian",
}

# Canonical dynasty / period -> aliases
PERIOD_ALIASES: dict[str, list[str]] = {
    "Maratha": ["maratha", "marathas", "peshwa", "peshwas", "bhonsle", "mahratta",
                "shivaji kingdom"],
    "Chola": ["chola", "cholas", "raja raja chola", "great living chola"],
    "Mughal": ["mughal", "mughals", "mogul", "moghul", "shah jahan", "akbar the great",
               "jahangir", "mumtaz"],
    "Rajput": ["rajput", "rajputs", "sisodia", "sisodias", "kachhwaha", "kachhwaha",
               "kachwaha", "mewar", "maarwar", "rajput-mughal"],
    "Vijayanagara": ["vijayanagara", "vijayanagar", "vijaynagar", "vijayanagara empire"],
    "Pallava": ["pallava", "pallavas"],
    "Chalukya": ["chalukya", "chalukyas", "calukya"],
    "Pandya": ["pandya", "pandyas"],
    "Nayak": ["nayak", "nayaks", "nayaka"],
    "Mauryan": ["mauryan", "maurya", "ashoka", "ashokan", "ashoka empire"],
    "Satavahana": ["satavahana", "satavahanas", "shatavahana"],
    "Vakataka": ["vakataka", "vakatakas"],
    "Rashtrakuta": ["rashtrakuta", "rashtrakutas"],
    "Sultanate": ["delhi sultanate", "sultanate", "mamluk", "khalji", "tughlaq",
                  "lodi", "iltutmish", "aibak"],
    "Ganga": ["eastern ganga", "gangas", "ganga dynasty", "kalinga"],
    "Chandela": ["chandela", "chandelas", "kandariya"],
    "Ancient": ["ancient", "vedic", "prehistoric", "pre history", "acheulian",
                "megalithic", "protohistoric"],
    "Medieval": ["medieval", "mediaeval", "mediaeval"],
    "Colonial": ["colonial", "british", "victorian", "gothic revival", "art deco",
                 "indo-saracenic", "portuguese", "dutch", "was gothic"],
}

PERIOD_BADGE = {
    "Maratha": "Maratha", "Chola": "Chola", "Mughal": "Mughal", "Rajput": "Rajput",
    "Vijayanagara": "Vijayanagara", "Pallava": "Pallava", "Chalukya": "Chalukya",
    "Pandya": "Pandya", "Nayak": "Nayak", "Mauryan": "Mauryan",
    "Satavahana": "Satavahana", "Vakataka": "Vakataka", "Rashtrakuta": "Rashtrakuta",
    "Sultanate": "Sultanate", "Ganga": "Ganga", "Chandela": "Chandela",
    "Ancient": "Ancient", "Medieval": "Medieval", "Colonial": "Colonial",
}

# State name/code aliases (used by entity extraction)
STATE_ALIASES: dict[str, list[str]] = {
    "Andhra Pradesh": ["andhra pradesh", "andhra", "ap"],
    "Arunachal Pradesh": ["arunachal pradesh", "arunachal"],
    "Assam": ["assam", "asam"],
    "Bihar": ["bihar"],
    "Chhattisgarh": ["chhattisgarh", "chattisgarh"],
    "Delhi": ["delhi", "new delhi", "national capital territory", "dl"],
    "Goa": ["goa"],
    "Gujarat": ["gujarat", "gujarat"],
    "Haryana": ["haryana"],
    "Himachal Pradesh": ["himachal pradesh", "himachal", "hp"],
    "Jammu and Kashmir": ["jammu and kashmir", "jammu kashmir", "kashmir"],
    "Jharkhand": ["jharkhand"],
    "Karnataka": ["karnataka", "karnatak"],
    "Kerala": ["kerala"],
    "Ladakh": ["ladakh"],
    "Madhya Pradesh": ["madhya pradesh", "madhyapradesh", "mp"],
    "Maharashtra": ["maharashtra", "maha", "mh"],
    "Manipur": ["manipur"],
    "Meghalaya": ["meghalaya"],
    "Mizoram": ["mizoram"],
    "Nagaland": ["nagaland"],
    "Odisha": ["odisha", "orissa"],
    "Punjab": ["punjab"],
    "Rajasthan": ["rajasthan", "rajasthan"],
    "Sikkim": ["sikkim"],
    "Tamil Nadu": ["tamil nadu", "tamilnadu", "tamil", "tn", "tamil nadu"],
    "Telangana": ["telangana", "hyderabad region"],
    "Tripura": ["tripura"],
    "Uttar Pradesh": ["uttar pradesh", "uttarpradesh", "up"],
    "Uttarakhand": ["uttarakhand", "uttaranchal"],
    "West Bengal": ["west bengal", "bengal", "wb"],
}

# Common Devanagari spellings for flagship sites (alternate-name matches)
DEVANAGARI_NAMES: dict[str, str] = {
    "शनीवार वाडा": "shaniwar wada",
    "ताज महल": "taj mahal",
    "लाल किला": "red fort",
    "हुमायूं का मकबरा": "humayuns tomb",
    "कुतुब मीनार": "qutb minar",
    "अजंता की गुफाएं": "ajanta caves",
    "एलोरा की गुफाएं": "ellora caves",
    "सांची स्तूप": "sanchi stupa",
}

# Curated popular queries used for empty-state fallback suggestions
POPULAR_QUERIES: list[str] = [
    "Buddhist temples in Maharashtra",
    "Maratha forts",
    "Mughal architecture",
    "UNESCO World Heritage sites",
    "Chola temples",
    "Cave temples",
    "Classical dances of India",
    "Handicrafts and textiles",
    "Heritage sites in Tamil Nadu",
    "Ancient temples",
    "National parks and sanctuaries",
    "Museums of India",
]

# ---------------------------------------------------------------------------
# Reverse lookup indices (canonical alias -> (kind, canonical))
# ---------------------------------------------------------------------------
def _build_alias_map() -> dict[str, tuple[str, str]]:
    alias_map: dict[str, tuple[str, str]] = {}
    for canonical, aliases in CATEGORY_ALIASES.items():
        for a in aliases:
            alias_map[normalize(a)] = ("category", canonical)
    for canonical, aliases in RELIGION_ALIASES.items():
        for a in aliases:
            alias_map[normalize(a)] = ("religion", canonical)
    for canonical, aliases in PERIOD_ALIASES.items():
        for a in aliases:
            alias_map[normalize(a)] = ("period", canonical)
    return alias_map


ALIAS_LOOKUP = _build_alias_map()


def _sorted_by_len(items) -> list:
    return sorted(items, key=lambda x: len(x[0].split()), reverse=True)


# ---------------------------------------------------------------------------
# Domain state shapes
# ---------------------------------------------------------------------------
@dataclass
class Intent:
    """Structurally parsed query intent."""
    raw: str
    phrase: str = ""
    tokens: list[str] = field(default_factory=list)
    state: str | None = None
    state_id: int | None = None
    city: str | None = None
    city_id: int | None = None
    category: str | None = None
    religion: str | None = None
    period: str | None = None
    heritage_type: str | None = None
    site_name: str | None = None
    site_id: int | None = None
    corrections: list[tuple[str, str]] = field(default_factory=list)  # (raw, corrected)
    site_correction: str | None = None

    def to_dict(self) -> dict:
        return {
            "state": self.state,
            "city": self.city,
            "category": self.category,
            "religion": self.religion,
            "period": self.period,
            "heritage_type": self.heritage_type,
        }


@dataclass
class ScoredResult:
    type: str
    label: str
    summary: str
    data: dict
    score: float
    reasons: list[str] = field(default_factory=list)


# ---------------------------------------------------------------------------
# Fuzzy matching helpers
# ---------------------------------------------------------------------------
def _close_token(word: str, candidates: list[str], cutoff: float = 0.82) -> str | None:
    """Best fuzzy candidate for a single token (Levenshtein via difflib)."""
    if len(word) < 4:
        return None
    matches = difflib.get_close_matches(word, candidates, n=1, cutoff=cutoff)
    return matches[0] if matches else None


def _name_ratio(a: str, b: str) -> float:
    """Similarity between two names using sorted tokens (order-insensitive)."""
    ta = sorted(normalize(a).split())
    tb = sorted(normalize(b).split())
    if not ta or not tb:
        return 0.0
    return difflib.SequenceMatcher(None, " ".join(ta), " ".join(tb)).ratio()


def _closest_name(query_tokens: list[str], names: list[tuple[str, int, str]],
                  cutoff: float = 0.78) -> tuple[str | None, int | None, float]:
    """Best overall fuzzy match of the whole query against a names index."""
    joined = " ".join(query_tokens)
    best, best_id, best_ratio = None, None, 0.0
    for name, row_id, _kind in names:
        ratio = _name_ratio(joined, name)
        if ratio > best_ratio:
            best, best_id, best_ratio = name, row_id, ratio
    if best_ratio < cutoff:
        return None, None, best_ratio
    return best, best_id, best_ratio


# ---------------------------------------------------------------------------
# Entity extraction
# ---------------------------------------------------------------------------
def _match_aliases(tokens: set[str], alias_map: dict[str, tuple[str, str]],
                   allowed_kinds: set[str]) -> tuple[str | None, str | None, list[str]]:
    """Return (kind, canonical, corrections) for the best alias present in tokens.

    Checks longest aliases first so multi-word phrases win over single tokens.
    Falls back to fuzzy token matching when exact token-set matching fails.
    """
    matched: dict[tuple[str, str], set[str]] = {}
    for raw_alias, (kind, canonical) in _sorted_by_len(alias_map.items()):
        if kind not in allowed_kinds:
            continue
        if not raw_alias:
            continue
        alias_toks = set(raw_alias.split())
        if alias_toks.issubset(tokens):
            matched.setdefault((kind, canonical), set()).add(raw_alias)
    if matched:
        best = max(matched, key=lambda k: len(k[1]))
        return best[0], best[1], [raw_alias for raw_alias in matched[best]]

    # Fuzzy fallback: map individual tokens to closest alias token
    fuzzy_corr: dict[tuple[str, str], str] = {}
    for raw_alias, (kind, canonical) in alias_map.items():
        if kind not in allowed_kinds:
            continue
        alias_words = raw_alias.split()
        if len(alias_words) == 1:
            aw = alias_words[0]
            if len(aw) >= 4:
                hit = _close_token(aw, list(tokens), cutoff=0.85)
                if hit:
                    fuzzy_corr[(kind, canonical)] = hit
    if fuzzy_corr:
        best_kind, best_canon = max(
            fuzzy_corr,
            key=lambda k: len(fuzzy_corr[k])
        )
        return best_kind, best_canon, []
    return None, None, []


def _fuzzy_state_city(db: Session, raw: str, tokens: set[str]) -> tuple[set[str], set[str]]:
    """Best-effort fuzzy fixes for state & city attributes.

    Returns (state_corrections, city_corrections) as sets of canonical names.
    """
    state_names = {normalize(s.name) for s in db.query(State).all() if s.name}
    state_codes = {normalize(s.code) for s in db.query(State).all() if s.code}
    city_names = {normalize(c.name) for c in db.query(City).all() if c.name}
    state_corr, city_corr = set(), set()
    for t in tokens:
        hit = _close_token(t, list(state_names | state_codes))
        if hit:
            state_corr.add(hit)
            continue
        hit = _close_token(t, list(city_names))
        if hit:
            city_corr.add(hit)
    return state_corr, city_corr


def parse_query(db: Session, q: str) -> Intent:
    """Detect structured constraints from a raw natural-language query."""
    intent = Intent(raw=q.strip(), phrase=normalize(q.strip()))
    intent.tokens = tokenize(q)
    if not intent.tokens:
        return intent

    tokens = set(intent.tokens)

    # 1. State by alias / name (longest first)
    state_aliases_norm = {
        normalize(a): name for name, aliases in STATE_ALIASES.items() for a in aliases
    }
    state_aliases_sorted = sorted(state_aliases_norm, key=lambda a: len(a.split()), reverse=True)
    for alias in state_aliases_sorted:
        alias_toks = set(alias.split())
        if alias_toks.issubset(tokens):
            intent.state = state_aliases_norm[alias]
            break

    # 2. City by name (longest matches first) from live DB
    cities = [(normalize(c.name), c.id, c.name) for c in db.query(City).all() if c.name]
    for cname, cid, cdisplay in sorted(cities, key=lambda x: len(x[0].split()), reverse=True):
        c_tokens = set(cname.split())
        if c_tokens.issubset(tokens):
            intent.city = cdisplay
            intent.city_id = cid
            break

    # 3. Category / religion / period aliases
    for kind in ("category", "religion", "period"):
        k, canonical, _corr = _match_aliases(tokens, ALIAS_LOOKUP, {kind})
        if k:
            setattr(intent, kind, canonical)

    # 4. heritage_type hints
    if tokens & {"tangible"}:
        intent.heritage_type = "tangible"
    if tokens & {"intangible", "living", "performing", "art form", "artforms"}:
        intent.heritage_type = "intangible"
    if intent.category in ("UNESCO",) or tokens & {"world", "unesco"}:
        if intent.heritage_type is None:
            intent.heritage_type = "world"

    # 5. Fuzzy corrections for state/city tokens
    state_corr, city_corr = _fuzzy_state_city(db, q, tokens)
    if not intent.state and state_corr:
        best = next(iter(state_corr))
        for canonical_name in STATE_ALIASES:
            if normalize(canonical_name) == best:
                intent.state = canonical_name
                break
        if not intent.state:
            intent.state = best.title()
    if not intent.city and city_corr:
        intent.city = next(iter(city_corr)).title()

    # 6. Site-name detection: fuzzy-match leftover/high-signal tokens & full phrase
    site_names: list[tuple[str, int, str]] = []
    seen: set[str] = set()
    for h in _candidate_sites(db):
        nm = normalize(h["name"])
        if nm and nm not in seen:
            seen.add(nm)
            site_names.append((nm, h["id"], "heritage"))
    for m in db.query(Museum).all():
        nm = normalize(m.name)
        if nm and nm not in seen:
            seen.add(nm)
            site_names.append((nm, m.id, "museum"))

    full_match, full_id, full_ratio = _closest_name(intent.tokens, site_names)
    if full_match is not None:
        intent.site_name = full_match
        intent.site_id = full_id
        intent.site_correction = full_match if full_ratio < 1.0 else None
        return intent

    # leftover-token fuzzy site-name hint (e.g. "Shanivar Wada", "Sinhagadh")
    leftover = tokens.copy()
    for attr in ("state", "city", "category", "religion", "period"):
        val = getattr(intent, attr)
        if val:
            leftover -= phrase_tokens(val)
            if attr == "city" and intent.city:
                leftover -= phrase_tokens(intent.city)
    if leftover:
        name_tokens = [t for t in leftover if len(t) >= 4]
        for t in name_tokens:
            hit = _close_token(t, list(seen))
            if hit:
                intent.site_name = hit
                intent.site_correction = hit
                intent.corrections.append((t, hit))
        if not intent.site_name:
            for t in name_tokens:
                closest, _cnt, ratio = _closest_name([t], site_names)
                if closest and ratio >= 0.82:
                    intent.site_name = closest
                    intent.site_correction = closest
                    intent.corrections.append((t, closest))
                    break

    # Record state/city corrections for did_you_mean
    for s in state_corr:
        intent.corrections.append((s, s))
    for c in city_corr:
        intent.corrections.append((c, c))

    return intent


def _candidate_sites(db: Session) -> list[dict]:
    out = []
    for h in db.query(HeritageSite).all():
        out.append({"id": h.id, "name": h.name, "row": h})
    return out


# ---------------------------------------------------------------------------
# Per-item scoring
# ---------------------------------------------------------------------------
def _site_text(h) -> str:
    fields = [
        "_", h.name, h.category, h.description, h.history, h.location,
        h.historical_period, h.architecture, h.significance, h.famous_people,
        h.related_events, h.region,
    ]
    return normalize(" ".join(str(f) or "" for f in fields[1:]))


def _category_hits(h, canonical: str) -> bool:
    if not canonical or canonical == "Heritage":
        return False
    text = _site_text(h)
    for alias in CATEGORY_ALIASES.get(canonical, [canonical]):
        if _tokens_present(text, alias):
            return True
    return False


def _tokens_present(text: str, alias: str) -> bool:
    return set(alias.split()).issubset(set(text.split()))


def _religion_present(h, canonical: str) -> bool:
    text = _site_text(h)
    for alias in RELIGION_ALIASES.get(canonical, [canonical]):
        if _tokens_present(text, alias):
            return True
    return False


def _period_present(h, canonical: str) -> bool:
    text = _site_text(h)
    for alias in PERIOD_ALIASES.get(canonical, [canonical]):
        if _tokens_present(text, alias):
            return True
    return False


def score_site(h, intent: Intent) -> ScoredResult:
    """Weighted relevance score for a heritage site against a parsed intent."""
    reasons: list[str] = []
    added: set[str] = set()
    score = 0.0

    name_norm = normalize(h.name)
    q_phrase = " ".join(intent.tokens)
    site_text = _site_text(h)

    # 1. Exact name / slug / Devanagari alternate
    dev = DEVANAGARI_NAMES.get(h.name)
    if name_norm and (name_norm == q_phrase or q_phrase in name_norm or set(name_norm.split()).issubset(set(intent.tokens))):
        score += W_EXACT_NAME
    elif h.slug and normalize(h.slug) == q_phrase:
        score += W_EXACT_NAME
    elif intent.site_name and name_norm == intent.site_name:
        score += W_ALT_NAME
        if "name" not in added:
            added.add("name")
    elif dev and (dev == q_phrase or " ".join(sorted(dev.split())) == " ".join(sorted(name_norm.split()))):
        score += W_ALT_NAME
    elif intent.site_name and _name_ratio(name_norm, intent.site_name) >= 0.8:
        score += W_ALT_NAME

    # 2. Category / type
    if intent.category and _category_hits(h, intent.category):
        score += W_CATEGORY
        if intent.category not in added:
            reasons.append(CATEGORY_BADGE.get(intent.category, intent.category))
            added.add(intent.category)

    # 3. Geography
    state_match = False
    if intent.state:
        state_names = {normalize(intent.state)}
        if h.state_id and h.state and normalize(h.state.name) in state_names or _tokens_present(
            _site_text(h), intent.state
        ):
            state_match = True
    if state_match or (h.state and intent.state and normalize(h.state.name) == normalize(intent.state)):
        score += W_GEO
        if intent.state not in added:
            reasons.append(intent.state)
            added.add(intent.state)
    if intent.city:
        if (h.city and normalize(h.city.name) == normalize(intent.city)) or _tokens_present(
            _site_text(h), intent.city
        ):
            score += W_GEO
            if intent.city not in added:
                reasons.append(intent.city)
                added.add(intent.city)

    # 4. Religion / tradition
    if intent.religion and _religion_present(h, intent.religion):
        score += W_PERIOD
        if intent.religion not in added:
            reasons.append(RELIGION_BADGE.get(intent.religion, intent.religion))
            added.add(intent.religion)

    # 5. Dynasty / period
    if intent.period and _period_present(h, intent.period):
        score += W_PERIOD
        if intent.period not in added:
            reasons.append(PERIOD_BADGE.get(intent.period, intent.period))
            added.add(intent.period)

    # 6. General description hit
    if intent.tokens and not score:
        hits = sum(1 for t in set(intent.tokens) if t in site_text)
        if hits:
            score += W_TEXT * min(hits, 3) / 3

    # Combination bonus: State + Category + Religion all matched
    if intent.state and intent.category and (intent.religion or intent.period):
        if added & {intent.state} and (added & {intent.category}) and (
            (intent.religion in added) or (intent.period in added)
        ):
            score += W_COMBO

    return ScoredResult(
        type="heritage",
        label=h.name,
        summary=(h.description or "").strip()[:160],
        data={"id": h.id, "state_id": h.state_id, "city_id": h.city_id},
        score=score,
        reasons=reasons,
    )


# ---------------------------------------------------------------------------
# Search orchestration
# ---------------------------------------------------------------------------
def search(
    db: Session,
    q: str,
    kind: str | None = None,
    state_id: int | None = None,
    city_id: int | None = None,
    heritage_type: str | None = None,
    period: str | None = None,
    limit: int = 20,
    offset: int = 0,
) -> dict:
    """Run intent-aware search across the platform's tables."""
    from .serializers import (
        city_row, commemoration_row, document_row, event_row,
        museum_row, publication_row, scheme_row, author_row, state_row,
    )

    intent = parse_query(db, q)
    results: list[ScoredResult] = []

    # Heritage sites — the primary search surface
    if kind in (None, "heritage", "heritageSite", "heritagesite"):
        heritage_ids: set[int] = set()
        for h in db.query(HeritageSite).order_by(HeritageSite.name).all():
            if state_id is not None and h.state_id != state_id:
                continue
            if city_id is not None and h.city_id != city_id:
                continue
            if heritage_type and h.heritage_type != heritage_type:
                continue
            if intent.state and h.state and normalize(h.state.name) != normalize(intent.state):
                continue
            if intent.city and h.city and normalize(h.city.name) != normalize(intent.city):
                continue
            if intent.heritage_type and h.heritage_type != intent.heritage_type:
                continue
            sr = score_site(h, intent)
            if sr.score == 0:
                continue
            sr.data = _heritage_meta(h)
            if intent.site_id is not None and h.id != intent.site_id:
                sr.score *= 0.6  # de-prioritise sites that are not the target
            heritage_ids.add(h.id)
            results.append(sr)

    # Supporting entities
    if kind in (None, "state") and not state_id:
        for s in db.query(State).order_by(State.name).all():
            if intent.state and normalize(s.name) != normalize(intent.state):
                continue
            sr = _score_generic("state", s.name, s.description, state_row(s), intent, 1.2)
            if sr:
                results.append(sr)
    if kind in (None, "city"):
        for c in db.query(City).order_by(City.name).all():
            if intent.city and normalize(c.name) != normalize(intent.city):
                continue
            if intent.state and c.state and normalize(c.state.name) != normalize(intent.state):
                continue
            sr = _score_generic("city", c.name, c.description, city_row(c), intent, 1.1)
            if sr:
                results.append(sr)
    if kind in (None, "museum"):
        for m in db.query(Museum).order_by(Museum.name).all():
            sr = _score_generic("museum", m.name, m.description, museum_row(m), intent, 1.1)
            if sr:
                results.append(sr)
    if kind in (None, "event"):
        for e in db.query(Event).order_by(Event.name).all():
            sr = _score_generic("event", e.name, e.description, event_row(e), intent, 1.1)
            if sr:
                results.append(sr)
    if kind in (None, "publication"):
        for p in db.query(Publication).order_by(Publication.title).all():
            sr = _score_generic("publication", p.title, p.description, publication_row(p), intent, 1.3)
            if sr:
                results.append(sr)
    if kind in (None, "author"):
        for a in db.query(Author).order_by(Author.name).all():
            sr = _score_generic("author", a.name, a.biography, author_row(a), intent, 1.2)
            if sr:
                results.append(sr)
    if kind in (None, "document"):
        for d in db.query(Document).order_by(Document.title).all():
            sr = _score_generic("document", d.title, d.description, document_row(d), intent, 1.0)
            if sr:
                results.append(sr)
    if kind in (None, "scheme"):
        for s in db.query(Commemoration).order_by(Commemoration.name).all():
            sr = _score_generic("commemoration", s.name, s.significance, commemoration_row(s), intent, 1.0)
            if sr:
                results.append(sr)

    results.sort(key=lambda r: r.score, reverse=True)
    total = len(results)
    page = results[offset:offset + limit]

    # did_you_mean & fallback suggestions
    did_you_mean = _compute_did_you_mean(intent, results)
    suggestions = []
    if not results:
        suggestions = _fallback_suggestions(db, q, intent)

    return {
        "query": q,
        "total": total,
        "interpreted": intent.to_dict(),
        "did_you_mean": did_you_mean,
        "suggestions": suggestions,
        "results": [
            {
                "type": r.type,
                "label": r.label,
                "summary": r.summary,
                "rank": round(r.score, 1),
                "match_reasons": r.reasons,
                "data": r.data,
            }
            for r in page
        ],
    }


def _heritage_meta(h) -> dict:
    return {
        "id": h.id,
        "state_id": h.state_id,
        "city_id": h.city_id,
        "name": h.name,
        "category": h.category,
        "slug": h.slug,
        "heritage_type": h.heritage_type,
        "region": h.region,
        "unesco_status": h.unesco_status,
        "image_url": h.image_url,
        "main_image": h.main_image,
        "historical_period": h.historical_period,
        "location": h.location,
        "city_name": h.city.name if h.city else None,
        "state_name": h.state.name if h.state else None,
    }


def _score_generic(item_type, label, summary, data, intent: Intent, boost: float):
    if not label:
        return None
    q_phrase = " ".join(intent.tokens)
    label_norm = normalize(label)
    score = 0.0
    if label_norm == q_phrase or q_phrase in label_norm:
        score = W_EXACT_NAME
    elif intent.site_name and label_norm == intent.site_name:
        score = W_ALT_NAME
    else:
        text = " ".join(str(v or "") for v in (data or {}).values())
        combined = normalize(label + " " + text)
        hits = sum(1 for t in set(intent.tokens) if t in combined)
        if not hits:
            return None
        score = W_TEXT * min(hits, 3) / 3
    return ScoredResult(
        type=item_type,
        label=label,
        summary=(summary or str(label))[:160] if summary is not None else str(label),
        data=data or {},
        score=score * boost,
        reasons=_generic_reasons(intent, label_norm),
    )


def _generic_reasons(intent: Intent, label_norm: str) -> list[str]:
    reasons: list[str] = []
    if intent.state and label_norm == normalize(intent.state):
        reasons.append(intent.state)
    if intent.category and intent.category != "Heritage":
        if _tokens_present(label_norm, intent.category):
            reasons.append(CATEGORY_BADGE.get(intent.category, intent.category))
    return reasons


def _compute_did_you_mean(intent: Intent, results: list[ScoredResult]) -> str | None:
    if intent.site_correction and intent.site_correction not in intent.raw.lower():
        return intent.site_correction.title()
    if intent.corrections:
        # Rebuild a corrected query string from token corrections
        q_toks = list(intent.tokens)
        for raw, fixed in intent.corrections:
            if raw in q_toks:
                q_toks[q_toks.index(raw)] = fixed
        corrected = " ".join(q_toks)
        if corrected != " ".join(intent.tokens):
            return corrected.title()
    return None


def _fallback_suggestions(db: Session, q: str, intent: Intent) -> list[str]:
    """Return helpful suggested queries when nothing matched."""
    out: list[str] = []
    for phrase in POPULAR_QUERIES:
        if q.lower() in phrase.lower() or " ".join(intent.tokens[:2]).lower() in phrase.lower():
            out.append(phrase)
        if len(out) >= 6:
            break
    if len(out) < 3:
        out.extend(POPULAR_QUERIES[:6 - len(out)])
    return out[:6]


# ---------------------------------------------------------------------------
# Autocomplete suggestions endpoint support
# ---------------------------------------------------------------------------
def suggest(db: Session, q: str, limit: int = 8) -> dict:
    """Fast autocomplete suggestions over sites, entities and popular phrases."""
    term = q.strip()
    if not term:
        return {"query": q, "suggestions": []}
    term_l = term.lower()
    out: list[dict] = []
    seen: set[str] = set()

    def push(itype, label, query):
        key = (itype, label.lower())
        if key in seen or not label:
            return
        seen.add(key)
        out.append({"type": itype, "label": label, "query": query})

    for h in db.query(HeritageSite).filter(HeritageSite.name.ilike(f"{term_l}%")).order_by(HeritageSite.name).all():
        push("heritage", h.name, h.name)
    for m in db.query(Museum).filter(Museum.name.ilike(f"{term_l}%")).order_by(Museum.name).all():
        push("museum", m.name, m.name)
    for s in db.query(State).filter(State.name.ilike(f"{term_l}%")).order_by(State.name).all():
        push("state", s.name, s.name)
    for c in db.query(City).filter(City.name.ilike(f"{term_l}%")).order_by(City.name).all():
        push("city", c.name, c.name)

    for canonical in CATEGORY_ALIASES:
        if canonical.lower().startswith(term_l):
            push("category", canonical, f"{canonical} sites")
    for religion in RELIGION_ALIASES:
        if religion.lower().startswith(term_l):
            push("religion", religion, f"{religion} heritage sites")
    for period in PERIOD_ALIASES:
        if period.lower().startswith(term_l):
            push("period", period, f"{period} monuments")

    for phrase in POPULAR_QUERIES:
        if phrase.lower().startswith(term_l):
            push("popular", phrase, phrase)

    if not out:
        # substring fallback + fuzzy autocomplete
        site_names = [h.name for h in db.query(HeritageSite).order_by(HeritageSite.name).all()]
        mus_names = [m.name for m in db.query(Museum).order_by(Museum.name).all()]
        for name in list(site_names) + list(mus_names):
            if term_l in name.lower():
                push("heritage" if name in site_names else "museum", name, name)
        for name in difflib.get_close_matches(term, list(set(site_names)) + list(set(mus_names)),
                                              n=limit, cutoff=0.6):
            push("heritage" if name in site_names else "museum", name, name)
        for phrase in POPULAR_QUERIES:
            if not out:
                push("popular", phrase, phrase)

    for p in db.query(State).all():
        if len(out) >= limit:
            break
        push("state", p.name, p.name)

    return {"query": q, "suggestions": out[:limit]}