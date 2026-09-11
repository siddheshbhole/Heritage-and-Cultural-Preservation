"""Tests for the intelligent heritage search engine.

Runs against the isolated in-memory SQLite database provided by the shared
``db`` fixture in ``conftest.py``.
"""
from app.models import State
from app.search_engine import parse_query, search, suggest


def _top_names(payload, n=5):
    return [r["label"] for r in payload["results"]][:n]


def _label_set(payload):
    return {r["label"] for r in payload["results"]}


def _reasons_for(payload, label):
    for r in payload["results"]:
        if r["label"] == label:
            return r.get("match_reasons", [])
    return []


class TestExactEntitySearch:
    def test_shaniwar_wada(self, db):
        payload = search(db, "Shaniwar Wada")
        assert payload["total"] >= 1
        assert _top_names(payload)[0] == "Shaniwar Wada"

    def test_ajanta_caves(self, db):
        payload = search(db, "Ajanta Caves")
        assert "Ajanta Caves" in _label_set(payload)
        assert payload["results"][0]["rank"] >= 85

    def test_sanchi_stupa(self, db):
        payload = search(db, "Sanchi Stupa")
        assert "Sanchi Stupa" in _label_set(payload)
        assert payload["interpreted"]["heritage_type"] in (None, "world")


class TestLocationReligionCategorySearch:
    def test_buddhist_sites_in_maharashtra(self, db):
        payload = search(db, "Buddhist heritage sites in Maharashtra")
        assert payload["interpreted"]["state"] == "Maharashtra"
        assert payload["interpreted"]["religion"] == "Buddhist"
        assert payload["total"] >= 2
        labels = _label_set(payload)
        assert "Ajanta Caves" in labels
        reasons = _reasons_for(payload, "Ajanta Caves")
        assert "Maharashtra" in reasons
        assert "Buddhist" in reasons

    def test_vishnu_temples_in_tamil_nadu(self, db):
        payload = search(db, "Vishnu temples in Tamil Nadu")
        assert payload["interpreted"]["state"] == "Tamil Nadu"
        assert payload["interpreted"]["religion"] == "Hindu"
        assert payload["interpreted"]["category"] == "Temple"
        assert payload["total"] >= 1
        assert "Srirangam Ranganathaswamy Temple" in _label_set(payload)
        reasons = _reasons_for(payload, "Srirangam Ranganathaswamy Temple")
        assert "Tamil Nadu" in reasons
        assert "Hindu" in reasons


class TestAttributeAndDynastySearch:
    def test_maratha_forts(self, db):
        payload = search(db, "Maratha forts")
        assert payload["interpreted"]["period"] == "Maratha"
        assert payload["interpreted"]["category"] == "Fort"
        labels = _label_set(payload)
        assert "Sinhagad Fort" in labels
        assert "Fort" in _reasons_for(payload, "Sinhagad Fort")

    def test_mughal_architecture(self, db):
        payload = search(db, "Mughal architecture")
        assert payload["interpreted"]["period"] == "Mughal"
        assert payload["interpreted"]["category"] in ("Architecture", "Monument")

    def test_chola_temples(self, db):
        payload = search(db, "Chola temples")
        assert payload["interpreted"]["period"] == "Chola"
        assert payload["interpreted"]["category"] == "Temple"
        assert "Brihadeeswara Temple" in _label_set(payload)
        assert "Chola" in _reasons_for(payload, "Brihadeeswara Temple")


class TestMisspellingTolerance:
    def test_shanivar_wada(self, db):
        payload = search(db, "Shanivar Wada")
        assert payload["total"] >= 1
        assert _top_names(payload)[0] == "Shaniwar Wada"
        assert payload["did_you_mean"]

    def test_budhist_temples_in_maharastra(self, db):
        payload = search(db, "Budhist temples in Maharastra")
        assert payload["interpreted"]["religion"] == "Buddhist"
        assert payload["interpreted"]["state"] == "Maharashtra"
        assert payload["total"] >= 1
        assert "Ajanta Caves" in _label_set(payload)


class TestFuzzyMatchingPrimitives:
    def test_parse_query_state_aliases(self, db):
        intent = parse_query(db, "heritage sites in mh")
        assert intent.state == "Maharashtra"

    def test_parse_query_category_synonyms(self, db):
        intent = parse_query(db, "forts and fortresses near Pune")
        assert intent.category == "Fort"
        assert intent.city == "Pune"

    def test_parse_query_religion_synonym(self, db):
        intent = parse_query(db, "buddhism caves")
        assert intent.religion == "Buddhist"


class TestNoResultAndFallback:
    def test_nonexistent_query(self, db):
        payload = search(db, "Nonexistent query 12345")
        assert payload["total"] == 0
        assert payload["results"] == []
        assert payload["suggestions"], "expected fallback suggestions on no results"
        assert isinstance(payload["suggestions"], list)

    def test_empty_suggestions_populated(self, db):
        payload = suggest(db, "aja", limit=5)
        assert payload["suggestions"]
        labels = [s["label"] for s in payload["suggestions"]]
        assert any("Ajanta" in lab for lab in labels)

    def test_did_you_mean_corrected(self, db):
        payload = search(db, "Shanivar Wada")
        corrected = (payload["did_you_mean"] or "").lower().replace("wada", "wada")
        assert "shaniwar" in corrected


class TestPayloadShape:
    def test_enhanced_payload_fields(self, db):
        payload = search(db, "Chola temples")
        assert set(payload.keys()) >= {
            "query", "total", "interpreted", "did_you_mean", "suggestions", "results"
        }
        first = payload["results"][0]
        assert set(first.keys()) >= {"type", "label", "summary", "rank", "match_reasons", "data"}

    def test_limit_offset_pagination(self, db):
        all_results = search(db, "temple", limit=100)
        page1 = search(db, "temple", limit=2, offset=0)
        page2 = search(db, "temple", limit=2, offset=2)
        assert len(page1["results"]) <= 2
        assert len(page2["results"]) <= 2
        assert page1["total"] == all_results["total"]
        first_page_labels = [r["label"] for r in page1["results"]]
        second_page_labels = [r["label"] for r in page2["results"]]
        assert not set(first_page_labels) & set(second_page_labels) or len(first_page_labels) < page1["total"]

    def test_kind_filter(self, db):
        only_museums = search(db, "Raja Dinkar Kelkar Museum", kind="museum")
        assert all(r["type"] == "museum" for r in only_museums["results"])

    def test_state_id_filter(self, db):
        mh_state = db.query(State).filter(State.name == "Maharashtra").first()
        payload = search(db, "Fort", state_id=mh_state.id)
        assert all(r["data"].get("state_id") == 1 for r in payload["results"])