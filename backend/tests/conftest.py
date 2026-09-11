"""Shared test fixtures for the backend test suite.

Runs against an isolated in-memory SQLite database (no dependency on the
live PostgreSQL / seeded SQLite file) so every scenario is deterministic.
"""
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base
from app.models import City, HeritageSite, Museum, State


@pytest.fixture()
def db():
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False})
    Base.metadata.create_all(engine)
    TestingSession = sessionmaker(bind=engine, autoflush=False)
    session = TestingSession()
    seed(session)
    yield session
    session.close()
    engine.dispose()


def seed(session):
    mh = State(id=1, name="Maharashtra", code="MH", region="West",
               capital="Mumbai", description="Home of the Marathi people and Peshwa legacy.")
    tn = State(id=2, name="Tamil Nadu", code="TN", region="South",
               capital="Chennai", description="Land of Dravidian temple architecture.")
    mp = State(id=3, name="Madhya Pradesh", code="MP", region="Central",
               capital="Bhopal", description="The heart of India, rich in Buddhist heritage.")
    session.add_all([mh, tn, mp])
    session.flush()

    pune = City(id=1, state_id=1, name="Pune", description="Cultural capital of Maharashtra.",
                latitude=18.5204, longitude=73.8567)
    aurangabad = City(id=2, state_id=1, name="Aurangabad", description="Gateway to the Ajanta & Ellora caves.",
                      latitude=19.8762, longitude=75.3433)
    thanjavur = City(id=3, state_id=2, name="Thanjavur", description="Chola capital.",
                     latitude=10.7870, longitude=79.1378)
    session.add_all([pune, aurangabad, thanjavur])
    session.flush()

    sites = [
        HeritageSite(
            id=1, city_id=1, state_id=1, name="Shaniwar Wada", slug="shaniwar-wada",
            category="Monument", description="The grand Peshwa palace-fort of Pune built in 1732.",
            history="Constructed by the Peshwas, the Maratha prime ministers, the palace complex "
                    "burned down in 1828 but remains the emblem of Maratha power.",
            significance="Emblem of Maratha power and the Peshwa legacy in Pune.",
            location="Kasba Peth, Pune", historical_period="Maratha, 18th century",
            latitude=18.5195, longitude=73.8553,
            heritage_type="tangible",
        ),
        HeritageSite(
            id=2, city_id=2, state_id=1, name="Ajanta Caves", slug="ajanta-caves",
            category="Cave", description="Buddhist rock-cut cave temples famous for Gupta-age murals.",
            history="Excavated between the 2nd century BCE and the 6th century CE, the caves recount "
                    "the Jataka tales of the Buddha's previous lives.",
            location="Aurangabad, Maharashtra", historical_period="Satavahana-Vakataka",
            latitude=20.5518, longitude=75.7033,
            unesco_status="WORLD", unesco_year="1983", heritage_type="tangible",
        ),
        HeritageSite(
            id=3, city_id=None, state_id=1, name="Sinhagad Fort", slug="sinhagad-fort",
            category="Fort", description="A hill fort near Pune seized by the Marathas under Tanaji Malusare.",
            history="The battle of Sinhagad (1670) saw Tanaji recapture the fort from the Mughals for "
                    "Chhatrapati Shivaji Maharaj, making it a Maratha legend.",
            location="25 km SW of Pune", historical_period="Maratha, 17th century",
            latitude=18.3641, longitude=73.7561,
            heritage_type="tangible",
        ),
        HeritageSite(
            id=4, city_id=3, state_id=2, name="Brihadeeswara Temple", slug="brihadeeswara-temple",
            category="Temple", description="The great Chola temple of Shiva at Thanjavur.",
            history="Built by Raja Raja Chola I in 1010 CE, its 66-metre vimana dominates the skyline.",
            location="Thanjavur, Tamil Nadu", historical_period="Chola, 11th century",
            latitude=10.7828, longitude=79.1321,
            unesco_status="WORLD", unesco_year="1987", heritage_type="tangible",
        ),
        HeritageSite(
            id=5, city_id=3, state_id=2, name="Srirangam Ranganathaswamy Temple", slug="srirangam-temple",
            category="Temple", description="A vast Vaishnavite temple complex dedicated to Vishnu.",
            history="The Sri Ranganathaswamy temple is among the largest functioning temples in the world, "
                    "epitomising Dravidian architecture with its towering gopurams.",
            location="Tiruchirappalli, Tamil Nadu", historical_period="Pandya-Nayak",
            latitude=10.8625, longitude=78.6896,
            heritage_type="tangible",
        ),
        HeritageSite(
            id=6, city_id=None, state_id=3, name="Sanchi Stupa", slug="sanchi-stupa",
            category="Monument", description="The great Ashokan stupa complex of Buddhist heritage.",
            history="Commissioned by Emperor Ashoka in the 3rd century BCE, the Great Stupa preserves "
                    "magnificent toranas or gateways.",
            location="Sanchi, Madhya Pradesh", historical_period="Mauryan-Shunga",
            unesco_status="WORLD", unesco_year="1989", heritage_type="tangible",
        ),
        HeritageSite(
            id=7, city_id=None, state_id=1, name="Ajanta Caves (World)", slug="ajanta-caves-world",
            category="World Heritage", description="UNESCO World Heritage Buddhist cave temples.",
            history="A serial property inscribed by UNESCO in 1983.",
            location="Aurangabad, Maharashtra", historical_period="Ancient",
            unesco_status="WORLD", unesco_year="1983", heritage_type="world",
        ),
    ]
    session.add_all(sites)
    session.add(
        Museum(id=1, city_id=1, name="Raja Dinkar Kelkar Museum",
               description="A private museum of everyday rural Indian artefacts assembled by Dinkar Kelkar.",
               collections="Rural Indian artefacts, lamps and weaponry.",
               location="Pune, Maharashtra")
    )
    session.commit()