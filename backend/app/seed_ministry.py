"""Seed the homepage "About the Ministry" section (``ministry_profile`` +
``ministry_leaders``).

Non-destructive: only fills the tables when they are empty, matching the
pattern used by :mod:`app.seed_heritage`. Content is drawn from the Ministry
of Culture's published organisational facts; numbers/leaders are plain DB rows
that can be refreshed centrally whenever the Ministry's own site changes,
without any frontend or API code change.

Run from the backend directory::

    python -m app.seed_ministry
"""
import datetime

from .database import Base, SessionLocal, engine
from .models import MinistryLeader, MinistryProfile


def main():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.query(MinistryProfile).count():
            print("Ministry profile already seeded; nothing to do.")
            return

        today = datetime.date.today().isoformat()

        db.add(MinistryProfile(
            heading="Ministry of Culture — Government of India",
            about=(
                "The Ministry of Culture is the nodal agency of the Government of India for the "
                "preservation, promotion and dissemination of India's cultural heritage — tangible "
                "and intangible. It administers a vast ecosystem of museums, monuments, libraries, "
                "archives, academies and cultural institutions that protect and showcase the "
                "country's civilisational legacy and connect citizens to their living traditions."
            ),
            mission=(
                "To preserve, protect and promote India's vast and diverse cultural heritage and to "
                "connect every Indian — citizen and scholar alike — with the living traditions of the nation."
            ),
            vision=(
                "To position India as a global cultural hub where heritage is preserved as a living "
                "resource, researched with rigour, and shared with the world."
            ),
            attached_offices=8,
            subordinate_offices=26,
            autonomous_organizations=39,
            directory_url="https://www.indiaculture.gov.in/directory-of-officers",
            organisations_url="https://www.indiaculture.gov.in/subordinate-offices-and-autonomous-bodies",
            source_name="Ministry of Culture, Government of India",
            source_url="https://www.indiaculture.gov.in",
            updated_at=today,
        ))

        leaders = [
            {
                "name": "Gajendra Singh Shekhawat",
                "title": "Hon'ble",
                "designation": "Union Minister of Culture",
                "image_url": "/images/ministry/minister-of-culture.png",
                "official_url": "https://www.indiaculture.gov.in",
            },
            {
                "name": "Dr. Satish Chandra Dubey",
                "title": "Hon'ble",
                "designation": "Minister of State for Culture",
                "image_url": "/images/ministry/minister-of-state-for-culture.png",
                "official_url": "https://www.indiaculture.gov.in",
            },
        ]
        for i, leader in enumerate(leaders):
            db.add(MinistryLeader(**leader, sort_order=i))

        db.commit()
        print("Ministry profile seeded.")
        print(f"  - ministry_profile: {db.query(MinistryProfile).count()}")
        print(f"  - ministry_leaders: {db.query(MinistryLeader).count()}")
    finally:
        db.close()


if __name__ == "__main__":
    main()