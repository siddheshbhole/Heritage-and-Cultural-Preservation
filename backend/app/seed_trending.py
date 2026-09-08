"""Seed / refresh the ``trending_items`` table for the homepage carousel.

Idempotent: it only inserts rows when the table is empty, and otherwise it just
recomputes scores. This lets it be run against an already-seeded database without
dropping the existing heritage data. Run from the backend directory:

    python -m app.seed_trending

The 12 prototype items blend TANGIBLE heritage (Somnath, Hampi, Konark, Red Fort,
Ajanta-Ellora, Rajgurunagar/Shivaram Rajguru) with LIVING / INTANGIBLE culture
(Deepavali, Chhath, Ol Chiki script, Garba, Chhau dance, Bharat Parv / regional
traditions) — the point being that Indian heritage is both physical and living.

Scores are deliberately computed as weighted trend signals so that the scheduled
updater (backend/app/routes/trending.py) can later re-rank and rotate items.
"""
from datetime import date

from .database import Base, SessionLocal, engine
from .models import TrendingItem

TODAY = date.today().isoformat()

# Weighting mirror (kept in sync with routes/trending.py).
WEIGHTS = {
    "current_event": 0.35,
    "recent_activity": 0.25,
    "cultural_significance": 0.20,
    "user_interest": 0.10,
    "recency": 0.10,
}


def _score(current_event, recent_activity, cultural_significance, user_interest, recency):
    return (
        current_event * WEIGHTS["current_event"]
        + recent_activity * WEIGHTS["recent_activity"]
        + cultural_significance * WEIGHTS["cultural_significance"]
        + user_interest * WEIGHTS["user_interest"]
        + recency * WEIGHTS["recency"]
    )


def _seed_data():
    return [
        # ---- TANGIBLE / HERITAGE SITES ----
        {
            "title": "Somnath Temple",
            "slug": "somnath-temple",
            "category": "Heritage Site",
            "kind": "heritage",
            "state": "Gujarat",
            "city": "Somnath",
            "image_url": "/images/trending/somnath.jpg",
            "image_position": "center",
            "summary": "One of the twelve Jyotirlingas and a landmark of India's coastal heritage, the Somnath temple at Prabhas Patan has been a centre of pilgrimage for over a thousand years. Its Chalukya-style shikhara and seaside setting make it a powerful symbol of cultural continuity and resilience.",
            "external_url": "https://www.somnath.org/",
            "explore_url": "/explore/heritage/somnath-temple",
            "current_event": 92, "recent_activity": 88, "cultural_significance": 98, "user_interest": 94, "recency": 86,
            "source_name": "Shree Somnath Trust / ASI",
            "source_url": "https://www.somnath.org/",
        },
        {
            "title": "Group of Monuments at Hampi",
            "slug": "hampi",
            "category": "Heritage Site",
            "kind": "heritage",
            "state": "Karnataka",
            "city": "Hampi",
            "image_url": "/images/heritage/hampi.jpg",
            "image_position": "center",
            "summary": "The spectacular ruins of the Vijayanagara capital — a UNESCO World Heritage Site — spread across a surreal boulder-strewn landscape beside the Tungabhadra. Virupaksha Temple and the stone chariot rank among India's greatest surviving expressions of Dravidian architecture.",
            "external_url": "https://whc.unesco.org/en/list/241/",
            "explore_url": "/explore/heritage/hampi",
            "current_event": 88, "recent_activity": 90, "cultural_significance": 97, "user_interest": 92, "recency": 84,
            "source_name": "UNESCO World Heritage Centre",
            "source_url": "https://whc.unesco.org/en/list/241/",
        },
        {
            "title": "Konark Sun Temple",
            "slug": "konark-sun-temple",
            "category": "Heritage Site",
            "kind": "heritage",
            "state": "Odisha",
            "city": "Konark",
            "image_url": "/images/heritage/konark.jpg",
            "image_position": "center",
            "summary": "The colossal 13th-century 'Black Pagoda' built by King Narasimhadeva I, conceived as a giant stone chariot of the Sun God drawn by seven horses. Its intricately carved wheels and temple sculpture make it a pinnacle of Kalinga architecture and a UNESCO World Heritage Site.",
            "external_url": "https://whc.unesco.org/en/list/246/",
            "explore_url": "/explore/heritage/konark-sun-temple",
            "current_event": 86, "recent_activity": 84, "cultural_significance": 96, "user_interest": 90, "recency": 82,
            "source_name": "UNESCO / ASI",
            "source_url": "https://whc.unesco.org/en/list/246/",
        },
        {
            "title": "Red Fort",
            "slug": "red-fort",
            "category": "Heritage Site",
            "kind": "heritage",
            "state": "Delhi",
            "city": "Delhi",
            "image_url": "/images/trending/red-fort.jpg",
            "image_position": "center",
            "summary": "The massive red-sandstone fort of Shah Jahan, built in 1648 and the backdrop for India's Independence Day addresses every year. Its Diwan-i-Khas, Moti Masjid and the raised marble pavilions embody the peak of Mughal imperial architecture.",
            "external_url": "https://whc.unesco.org/en/list/231/",
            "explore_url": "/explore/heritage/red-fort",
            "current_event": 90, "recent_activity": 86, "cultural_significance": 95, "user_interest": 91, "recency": 85,
            "source_name": "UNESCO / ASI",
            "source_url": "https://whc.unesco.org/en/list/231/",
        },
        {
            "title": "Ajanta & Ellora Caves",
            "slug": "ajanta-ellora-caves",
            "category": "Heritage Site",
            "kind": "heritage",
            "state": "Maharashtra",
            "city": "Aurangabad / Chhatrapati Sambhajinagar",
            "image_url": "/images/heritage/ajanta.jpg",
            "image_position": "center",
            "summary": "Two rock-cut marvels of Buddhist, Hindu and Jain art. Ajanta's painted murals narrate the Jataka tales, while Ellora's Kailasa — carved top-down from a single rock — is a triumph of engineering and devotion spanning over six centuries.",
            "external_url": "https://whc.unesco.org/en/list/242/",
            "explore_url": "/explore/heritage/ajanta-ellora-caves",
            "current_event": 84, "recent_activity": 82, "cultural_significance": 96, "user_interest": 89, "recency": 80,
            "source_name": "UNESCO / ASI",
            "source_url": "https://whc.unesco.org/en/list/242/",
        },
        {
            "title": "Shivaram Rajguru Heritage, Rajgurunagar",
            "slug": "shivaram-rajguru-heritage",
            "category": "Heritage Site",
            "kind": "heritage",
            "state": "Maharashtra",
            "city": "Rajgurunagar (Khed)",
            "image_url": "/images/trending/rajguru.jpg",
            "image_position": "center",
            "summary": "Rajgurunagar (Khed) is the birthplace of freedom fighter Shivaram Hari Rajguru, whose supreme sacrifice alongside Bhagat Singh and Sukhdev shook colonial rule. The Samadhi and memorial here keep alive a vital thread of India's regional revolutionary heritage.",
            "external_url": "https://www.maharashtra.gov.in/",
            "explore_url": "/explore/heritage/shivaram-rajguru-heritage",
            "current_event": 78, "recent_activity": 80, "cultural_significance": 88, "user_interest": 82, "recency": 88,
            "source_name": "Government of Maharashtra",
            "source_url": "https://www.maharashtra.gov.in/",
        },
        # ---- LIVING / INTANGIBLE CULTURE ----
        {
            "title": "Deepavali",
            "slug": "deepavali",
            "category": "Festival",
            "kind": "culture",
            "state": "Nationwide",
            "city": None,
            "image_url": "/images/trending/deepavali.jpg",
            "image_position": "center",
            "summary": "The Festival of Lights, celebrated across India and the diaspora as the victory of light over darkness. From traditional oil lamps (diyas) and rangoli to feasts and fireworks, Deepavali is one of the most widely observed living festivals of Indian culture.",
            "external_url": "https://whc.unesco.org/en/list/",
            "explore_url": "/explore/culture/deepavali",
            "current_event": 96, "recent_activity": 93, "cultural_significance": 90, "user_interest": 95, "recency": 82,
            "source_name": "Ministry of Culture",
            "source_url": "https://culture.gov.in/",
        },
        {
            "title": "Chhath Mahaparva",
            "slug": "chhath-mahaparva",
            "category": "Festival",
            "kind": "culture",
            "state": "Bihar | Jharkhand | UP",
            "city": None,
            "image_url": "/images/trending/chhath.jpg",
            "image_position": "center",
            "summary": "An ancient festival dedicated to the Sun God and Chhathi Maiya, observed at the banks of rivers and ponds with offerings to the rising and setting sun. Chhath's four days of austerity and devotion form one of India's deepest expressions of living folk heritage.",
            "external_url": "https://whc.unesco.org/en/list/",
            "explore_url": "/explore/culture/chhath-mahaparva",
            "current_event": 97, "recent_activity": 94, "cultural_significance": 89, "user_interest": 93, "recency": 92,
            "source_name": "State Cultural Departments",
            "source_url": "https://culture.gov.in/",
        },
        {
            "title": "Ol Chiki Script",
            "slug": "ol-chiki-script",
            "category": "Living Culture",
            "kind": "culture",
            "state": "Jharkhand",
            "city": None,
            "image_url": "/images/trending/ol-chiki.png",
            "image_position": "center",
            "summary": "The recognised script of the Santali language, created by Pandit Raghunath Murmu in 1925 to preserve and revitalise the literary heritage of the Santal people. Ol Chiki embodies the living, written identity of one of India's largest Adivasi communities.",
            "external_url": "https://www.unicode.org/versions/Unicode5.1.0/",
            "explore_url": "/explore/culture/ol-chiki-script",
            "current_event": 80, "recent_activity": 86, "cultural_significance": 88, "user_interest": 80, "recency": 90,
            "source_name": "UNESCO / Unicode Consortium",
            "source_url": "https://www.unicode.org/",
        },
        {
            "title": "Garba",
            "slug": "garba",
            "category": "Dance / Festival",
            "kind": "culture",
            "state": "Gujarat",
            "city": "Nationwide (Navratri)",
            "image_url": "/images/trending/garba.jpg",
            "image_position": "center",
            "summary": "The circular, clapping folk dance of Gujarat performed during the nine nights of Navratri — now a UNESCO-listed intangible cultural heritage. Garba's graceful rhythmic circles unite communities in celebration of the Goddess and of living tradition.",
            "external_url": "https://ich.unesco.org/en/RL/garba-of-gujarat-01686",
            "explore_url": "/explore/culture/garba",
            "current_event": 95, "recent_activity": 92, "cultural_significance": 87, "user_interest": 93, "recency": 86,
            "source_name": "UNESCO Intangible Heritage",
            "source_url": "https://ich.unesco.org/",
        },
        {
            "title": "Chhau Dance",
            "slug": "chhau-dance",
            "category": "Performing Art",
            "kind": "culture",
            "state": "Odisha | Jharkhand | WB",
            "city": None,
            "image_url": "/images/trending/chhau.jpg",
            "image_position": "center",
            "summary": "A martial, masked classical- folk dance from eastern India, UNESCO-listed as intangible cultural heritage. Chhau's vigorous movements, elaborate masks and musical narrative carry centuries of ritual and martial tradition across Odisha, Jharkhand and West Bengal.",
            "external_url": "https://ich.unesco.org/en/RL/chhau-dance-00337",
            "explore_url": "/explore/culture/chhau-dance",
            "current_event": 82, "recent_activity": 84, "cultural_significance": 90, "user_interest": 83, "recency": 84,
            "source_name": "UNESCO Intangible Heritage",
            "source_url": "https://ich.unesco.org/",
        },
        {
            "title": "Bharat Parv & Regional Traditions",
            "slug": "bharat-parv-regional-traditions",
            "category": "Living Culture",
            "kind": "culture",
            "state": "Nationwide",
            "city": None,
            "image_url": "/images/trending/bharat-parv.jpg",
            "image_position": "center",
            "summary": "Bharat Parv celebrates India's unity in diversity — folk and classical performance, regional crafts, cuisines and living traditions assembled from across the states. It is a moving showcase that the soul of India's heritage is regional, rural and continuously alive.",
            "external_url": "https://culture.gov.in/",
            "explore_url": "/explore/culture/bharat-parv-regional-traditions",
            "current_event": 85, "recent_activity": 88, "cultural_significance": 85, "user_interest": 86, "recency": 90,
            "source_name": "Ministry of Culture",
            "source_url": "https://culture.gov.in/",
        },
    ]


def build():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Insert only when the table is empty so we never clobber existing data.
        if db.query(TrendingItem).count() == 0:
            for d in _seed_data():
                db.add(TrendingItem(
                    title=d["title"], slug=d["slug"], category=d["category"], kind=d.get("kind", "heritage"),
                    state=d.get("state"), city=d.get("city"),
                    image_url=d["image_url"], image_position=d.get("image_position", "center"),
                    summary=d["summary"], external_url=d["external_url"], explore_url=d["explore_url"],
                    current_event_score=d["current_event"], recent_activity_score=d["recent_activity"],
                    cultural_significance_score=d["cultural_significance"],
                    user_interest_score=d["user_interest"], recency_score=d["recency"],
                    trend_score=_score(d["current_event"], d["recent_activity"], d["cultural_significance"],
                                       d["user_interest"], d["recency"]),
                    source_name=d["source_name"], source_url=d["source_url"], is_active=1,
                    published_at=TODAY, created_at=TODAY, updated_at=TODAY,
                ))
            db.commit()
            print("Trending seed inserted.")
        else:
            print("Trending table already populated; skipping insert.")
        for t in db.query(TrendingItem).order_by(TrendingItem.trend_score.desc()).all():
            print(f"  - {t.trend_score:5.1f}  {t.title}")
    finally:
        db.close()


if __name__ == "__main__":
    build()
