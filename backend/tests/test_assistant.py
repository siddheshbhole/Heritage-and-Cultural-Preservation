"""Tests for the grounded `/api/assistant/query` logic.

Calls ``assistant_query`` directly with the shared in-memory ``db`` fixture
from ``conftest.py`` (no HTTP client required).
"""
from app.routes.assistant import QueryIn, assistant_query


def test_exact_site_profile(db):
    resp = assistant_query(QueryIn(question="Tell me about Shaniwar Wada"), db=db)
    assert resp["place"] in ("Shaniwar Wada", "Pune", None)
    profile = resp["profile"]
    assert profile is not None
    assert profile["name"] == "Shaniwar Wada"
    assert profile["category"] == "Monument"
    assert profile["slug"] == "shaniwar-wada"
    assert "Shaniwar Wada" in resp["answer"]
    assert any(s["type"] == "heritage" for s in resp["sources"])


def test_exact_site_unesco_profile(db):
    resp = assistant_query(QueryIn(question="Tell me about Ajanta Caves"), db=db)
    profile = resp["profile"]
    assert profile["name"] == "Ajanta Caves"
    assert profile["unesco_status"] == "WORLD"


def test_filtered_discovery_returns_badged_cards(db):
    resp = assistant_query(QueryIn(question="Buddhist heritage sites in Maharashtra"), db=db)
    assert resp["itinerary"] == []
    assert resp["profile"] is None
    assert resp["recommendations"], "expected grounded recommendations"
    names = {r["name"] for r in resp["recommendations"]}
    assert "Ajanta Caves" in names
    ajanta = next(r for r in resp["recommendations"] if r["name"] == "Ajanta Caves")
    assert "Buddhist" in ajanta["match_reasons"]
    assert "Maharashtra" in ajanta["match_reasons"]
    assert ajanta["slug"] == "ajanta-caves"
    assert ajanta["image_url"] is None or isinstance(ajanta["image_url"], str)


def test_locations_sorted_by_distance(db):
    resp = assistant_query(QueryIn(question="Forts near Pune"), db=db)
    assert resp["recommendations"], "expected nearby forts"
    recs = resp["recommendations"]
    assert all("distance_km" in r for r in recs), "distance required when a geo base exists"
    assert "Sinhagad Fort" in {r["name"] for r in recs}
    assert recs[0]["distance_km"] <= recs[-1]["distance_km"]


def test_near_me_uses_payload_coordinates(db):
    resp = assistant_query(
        QueryIn(question="What heritage is near me?", lat=18.53, lng=73.84), db=db
    )
    recs = resp["recommendations"]
    assert recs, "expected heritage recommendations for a geo query"
    assert all("distance_km" in r for r in recs)
    assert recs[0]["distance_km"] <= 5.0, "Shaniwar Wada is ~1.8 km from the given point"


def test_near_me_without_coordinates_degrades_gracefully(db):
    resp = assistant_query(QueryIn(question="What heritage is near me?"), db=db)
    if not resp["recommendations"]:
        assert "near" in resp["answer"].lower()
    else:
        assert resp["recommendations"]


def test_itinerary_generator(db):
    resp = assistant_query(QueryIn(question="Plan a trip around Thanjavur"), db=db)
    assert resp["itinerary"], "expected a multi-leg itinerary"
    assert resp["profile"] is None
    days = resp["itinerary"]
    assert all(d["day"] == i + 1 for i, d in enumerate(days))
    assert all(d["stops"] for d in days)
    stop_names = {s["name"] for d in days for s in d["stops"]}
    assert "Brihadeeswara Temple" in stop_names
    assert "Day 1" in resp["answer"]


def test_misspelling_is_corrected(db):
    resp = assistant_query(QueryIn(question="Budhist temples in Maharastra"), db=db)
    assert resp["recommendations"], "fuzzy-corrected query should still return results"
    assert "Ajanta Caves" in {r["name"] for r in resp["recommendations"]}


def test_nonexistent_query_no_hallucination(db):
    resp = assistant_query(QueryIn(question="Nonexistent site 12345"), db=db)
    assert resp["recommendations"] == []
    assert resp["sources"] == []
    assert "could not find" in resp["answer"].lower()
    assert "don't know" in resp["answer"].lower()


def test_museum_branch_returns_recommendations(db):
    resp = assistant_query(QueryIn(question="museum near Pune"), db=db)
    assert resp["recommendations"]
    assert resp["recommendations"][0]["name"] == "Raja Dinkar Kelkar Museum"
    assert resp["recommendations"][0]["category"] == "Museum"
    assert resp["place"] == "Pune"
    assert any(s["type"] == "museum" for s in resp["sources"])


def test_response_payload_shape(db):
    resp = assistant_query(QueryIn(question="Chola temples"), db=db)
    assert set(resp.keys()) >= {
        "question", "intent", "place", "answer", "sources",
        "recommendations", "itinerary", "profile", "interpreted",
        "matched_count", "trust", "note",
    }
    rec = resp["recommendations"][0]
    assert set(rec.keys()) >= {
        "id", "name", "slug", "category", "location", "description",
        "match_reasons", "image_url",
    }