# Cultural Atlas of India — State Data Validation Report

**Generated:** 2026-09-11
**Scope:** All 28 states on the homepage Interactive India Map
**Dataset location:** `frontend/src/data/`
**Validation method:** Bundle `index.ts` via esbuild, execute a node validator against `STATE_DATA`, then run `tsc -b` and `vite build`.

## Result: PASS

| Result checks | Value |
|---|---|
| States populated | 28 / 28 |
| Licensed state photographs | 28 / 28 |
| Licensed city photographs | 184 / 184 |
| Curated entries (cities + heritage + culture + museums) | 831 |
| States with unattributed (missing-source) items | 0 |
| Duplicate state names or item names | 0 |
| Hover/selection highlight | project orange (`--orange`), neutral default (#fdf3ea) |
| Rituals & Culture (map panel + state page) | renders curated culture for all 28 states |
| TypeScript (`tsc -b`) | clean |
| Production build (`vite build`) | success |

## 28-state table

Counts below are computed live from the dataset arrays (`cities.length`, `heritage.length`, `culture.length`, `museums.length`) and match what the map's side panel displays. State photographs are merged in at load time from `state-images.ts`; every curated city also resolves a photograph.

| Code | State | Region | Cities | Heritage | Culture | Museums | State photo | Status |
|---|---|---|---|---|---|---|---|---|
| AP | Andhra Pradesh | South | 6 | 10 | 7 | 5 | Ajayu… (Tirumala) | OK |
| AR | Arunachal Pradesh | Northeast | 6 | 8 | 8 | 5 | Tawang Monastery | OK |
| AS | Assam | Northeast | 7 | 10 | 8 | 6 | Kamakhya/Kaziranga | OK |
| BR | Bihar | East | 7 | 10 | 7 | 7 | Mahabodhi Temple | OK |
| CG | Chhattisgarh | Central | 6 | 8 | 8 | 6 | Chitrakote Falls | OK |
| GA | Goa | West | 6 | 8 | 7 | 6 | Basilica of Bom Jesus | OK |
| GJ | Gujarat | West | 8 | 11 | 8 | 7 | Somnath Temple | OK |
| HP | Himachal Pradesh | North | 6 | 10 | 7 | 4 | Kedarkantha/Kangra | OK |
| HR | Haryana | North | 5 | 8 | 7 | 5 | Kurukshetra | OK |
| JH | Jharkhand | East | 6 | 8 | 7 | 6 | Parasnath Hill | OK |
| KA | Karnataka | South | 7 | 12 | 8 | 8 | Hampi | OK |
| KL | Kerala | South | 7 | 10 | 8 | 6 | Houseboat/backwaters | OK |
| MH | Maharashtra | West | 8 | 12 | 8 | 7 | Ajanta Caves | OK |
| ML | Meghalaya | Northeast | 6 | 8 | 8 | 5 | Living Root Bridge | OK |
| MN | Manipur | Northeast | 6 | 8 | 8 | 5 | Loktak Lake | OK |
| MP | Madhya Pradesh | Central | 8 | 10 | 8 | 7 | Khajuraho | OK |
| MZ | Mizoram | Northeast | 5 | 5 | 8 | 4 | Aizawl town | OK |
| NL | Nagaland | Northeast | 6 | 8 | 8 | 5 | Hornbill/Kohima | OK |
| OD | Odisha | East | 8 | 10 | 8 | 7 | Konark Sun Temple | OK |
| PB | Punjab | North | 6 | 8 | 7 | 6 | Golden Temple | OK |
| RJ | Rajasthan | North | 8 | 13 | 8 | 7 | Hawa Mahal | OK |
| SK | Sikkim | Northeast | 5 | 8 | 8 | 5 | Kangchenjunga | OK |
| TG | Telangana | South | 6 | 10 | 8 | 6 | Charminar | OK |
| TN | Tamil Nadu | South | 8 | 12 | 8 | 7 | Brihadisvara Temple | OK |
| TR | Tripura | Northeast | 5 | 8 | 8 | 5 | Ujjayanta Palace | OK |
| UK | Uttarakhand | North | 7 | 10 | 7 | 5 | Kedarnath Temple | OK |
| UP | Uttar Pradesh | North | 8 | 12 | 8 | 7 | Taj Mahal | OK |
| WB | West Bengal | East | 7 | 10 | 8 | 7 | Victoria Memorial | OK |

Every photograph is a real Wikimedia Commons image obtained via the Commons search API (`generator=search`, `prop=imageinfo`, `iiurlwidth=800`), filtered to exclude maps/logos/seals/SVG and tiny/irrelevant files, with the author/credits line and the Commons file page URL stored per image. No URL is hardcoded in a component — images are data merged in `index.ts`.

## Data quality checks performed

1. **Coverage** — one dataset entry per state code for all 28 states; the 8 union territories intentionally keep the existing fallback panel (no fabricated data).
2. **Counts** — panel UI reads counts directly from `STATE_DATA[code].{cities,heritage,culture,museums}.length`; the validator asserts the same number the panel renders (verified 831 total).
3. **Source attribution** — every heritage, culture, and museum item carries a `sourceName` (UNESCO, Archaeological Survey of India, Ministry of Culture / Indian Culture Portal, Directory of Museums in India, state tourism departments, or the governing trust/body). Culture entries default to the Indian Culture Portal attribution via `withDefaults()` in `index.ts` when the curated file has not set one.
4. **Duplicates** — no duplicate state names and no duplicate item names within any state section.
5. **Placeholders / fabrication** — removed the placeholder `Krishna Museum of NID?` (Haryana) and several weak/fabricated entries (e.g. Maharashtra's "Mahatma Jyotiba Phule museum", Gujarat's "Prabhas Patan bhoot-temple belt"), replaced with verifiable sites (Mani Bhavan Gandhi Museum; Vijay Vilas Palace, Mandvi; Siddi dhamal; FRI Silviculture Museum; Ram Jhula/Laxman Jhula bridges).
6. **Theme coverage** — all 28 states resolve a `StateTheme` in `config/stateThemes.ts`; motifs still overlay the orange fill for regional texture.
7. **Highlight color** — hover/selection no longer derives from region gradients. `IndiaMap.tsx` fills the hovered/selected path with `var(--orange)`; `theme.css` sets the neutral default `#fdf3ea` for all states (data or no-data) and orange only on hover/selected. The legend shows two entries: "State (neutral)" and "Hovered/selected (orange)".
8. **Images** — validator re-checks every state and every curated city for a non-empty `image`, and re-runs `tsc -b` + `vite build` after the data-merge change.

## Phase-2 report — the 10 questions

1. **Why did some states show only 2–3 cities?** The API-backed `StateDetail` page was driven by backend `s.cities`, whose seed file has detailed city data for only ~10 of 36 states, so most states had short or empty lists. The curated dataset (`north.ts` … `northeast.ts`) has rich data for all 28 states and was never consumed. `StateDetail.tsx` was reworked to render the curated arrays (5–8 cities per state, with photographs and descriptions) and to link each city to its `/cities/:id` API page when a matching API city exists.
2. **Why was the "Rituals & Culture" section empty/unusable?** The tab read API long-text `s.rituals || s.culture`, which is `null` for most states in the seed. It now renders the curated `culture` array (7–8 rituals/traditions per state, with type chips, descriptions, and Ministry of Culture attribution) and appends any API long-text it finds. The map side panel's "Rituals & culture" section (curated) was already present and works.
3. **Where did the green hover come from?** `theme.css` lines 759–762: `.state-path.has-data { fill: var(--green-soft) }` and `.has-data:hover/.has-data.selected { fill: var(--green) }`, reinforced by `IndiaMap.tsx` filling hovered/selected paths with region-gradient colors. Both were the cause; both were changed.
4. **How is the highlight fixed?** `IndiaMap.tsx` now sets `fill = 'var(--orange)'` when a path is hovered or selected; the CSS green rules were replaced with the neutral `#fdf3ea` default and orange hover/selected. Motif overlays remain for texture.
5. **How were photographs added without touching components or the backend?** A one-time script (`fetch-commons-images.mjs`) queried the Wikimedia Commons API for a curated landmark search per state and per city, stored the results in `frontend/src/data/state-images.ts` (data only), and `index.ts` merges them into `STATE_DATA` at load (`withImages`, fuzzy name matching via `normName`). Components read `image`/`imageCredit`/`imagePage` fields like any other data.
6. **What are the per-state counts?** See the 28-state table above (cities 5–8, heritage 5–13, culture 4–8, museums 4–8 per state; 831 items total).
7. **Which states have limited data?** Mizoram has the smallest footprint (5 cities, 5 heritage sites) — honest, verifiable coverage. No state was padded with fabricated entries; union territories intentionally use the fallback panel.
8. **What source files changed?** `frontend/src/data/state-images.ts` (new, generated), `frontend/src/data/types.ts` (image fields), `frontend/src/data/index.ts` (image merge + attribution defaults), `frontend/src/pages/StateDetail.tsx` (rework: hero photo, city/heritage/museum cards, Culture & Rituals tab, API linking), `frontend/src/components/IndiaMap.tsx` (orange fills, thumbnails, state photo panel, legend), `frontend/src/styles/theme.css` (map block, hero, entry cards, thumbnails). Backend and database intentional untouched.
9. **What do the validation and build show?** 28/28 states, 184/184 city photos, 0 missing attributions, 0 duplicates, `tsc -b` clean, `vite build` success (only the pre-existing >500 kB chunk advisory).
10. **Does the map work on mobile?** Yes — tapping a state fires the same `onSelect` navigator, opening the full state page (hero photo, city cards with photos, heritage, museums, culture) which provides the same essential information hover shows on desktop. Hover remains for mouse users. The panel accordions (3 items + "Show all") are an intentional summary; the state page shows everything.

## Files touched

- `frontend/src/data/types.ts` — data model + `OFFICIAL_SOURCES` constants
- `frontend/src/data/north.ts`, `south.ts`, `east.ts`, `central.ts`, `west.ts`, `northeast.ts` — curated state datasets
- `frontend/src/data/state-images.ts` — AUTO-GENERATED Commons photographs (28 states, 184 cities); regenerate via the script, do not hand-edit
- `frontend/src/data/index.ts` — aggregator + lookup helpers + `withImages` merge + `withDefaults` attribution
- `frontend/src/config/stateThemes.ts` — 28 state themes (motifs over orange fill)
- `frontend/src/components/IndiaMap.tsx` — orange hover/selected fill, city thumbnails, state photo panel, 2-entry legend
- `frontend/src/pages/StateDetail.tsx` — curated-and-API rendering, hero photo, Culture & Rituals tab
- `frontend/src/styles/theme.css` — map block (neutral default + orange hover), panel, hero, entry-card, thumbnail styles