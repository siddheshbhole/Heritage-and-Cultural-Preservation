"""Add heritage videos published on non-Ministry channels to the Media video gallery.

The gallery was originally seeded entirely from the Ministry of Culture's own
YouTube channel, so every row carried the implicit attribution "Ministry of
Culture, Government of Culture". The rows below are heritage / culture-heritage
videos published on other channels, each tagged with its real publishing
channel in ``source_name`` so the page does not misattribute them.

Thumbnails follow the existing convention: a local 480x360 copy at
``frontend/public/images/media/videos/<youtube_id>.jpg``.

Idempotent — safe to re-run; rows are upserted on primary key.
"""
from .database import SessionLocal
from .models import MediaVideo

IMG = "/images/media"

# (id, title, date DD.MM.YYYY, duration, language, youtube_id, source_name, display_order)
VIDEOS = [
    (13, "PM Modi Launches Prambanan Restoration Project — India’s Mission To Save "
         "Hindu Temples Across Asia", "11.07.2026", "6MINS 40SEC", "English",
     "ExBHOMGthXY", "DD India", 12),
    (14, "India’s Cultural Recovery Mission Brings Stolen Heritage Back Home",
     "16.05.2026", "3MINS 28SEC", "English", "StPcn5fI-PI", "DD India", 13),
    (15, "PM Modi’s Cultural Gifts During Five-Nation Tour", "21.05.2026",
     "8MINS 54SEC", "English", "mxMTUFluK4A", "DD India", 14),
    (16, "Samrat Samprati Museum Inauguration — Celebrating Jain Wisdom and India’s "
         "Timeless Heritage", "31.03.2026", "1MINS 21SEC", "English",
     "ZaBdsk-MLWg", "MyGov India", 15),
    (17, "How PM Modi Revitalized India’s Cultural Landmarks", "18.06.2026",
     "1MINS 40SEC", "English", "9eRtKmb8WXM", "MyGov India", 16),
    (18, "Nalanda: India’s Ancient Wisdom", "28.06.2026", "1MINS 45SEC",
     "English", "vPpa8OOhKl8", "Bharatiya Janata Party", 17),
    (19, "The BEAUTY that is Somnath!", "11.05.2026", "16 SECONDS", "English",
     "uDZ0OxLpmJA", "Narendra Modi", 18),
    (20, "Old Buildings Will Now Turn Into A Museum", "13.02.2026", "1MINS 21SEC",
     "English", "jDRS99_yDtE", "India Today", 19),
]


def main():
    db = SessionLocal()
    try:
        for vid, title, date, duration, lang, yid, source, order in VIDEOS:
            row = db.get(MediaVideo, vid)
            if row is None:
                row = MediaVideo(id=vid)
                db.add(row)
            row.title = title
            row.date = date
            row.duration = duration
            row.language = lang
            row.youtube_id = yid
            row.thumbnail_url = f"{IMG}/videos/{yid}.jpg"
            row.source_name = source
            row.display_order = order
        db.commit()
        print(f"Upserted {len(VIDEOS)} heritage videos (ids 13-20).")
    finally:
        db.close()


if __name__ == "__main__":
    main()
