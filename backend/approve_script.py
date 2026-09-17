import sys
import os
sys.path.append(os.path.dirname(__file__))

from app.database import SessionLocal
from app.models import HeritageGuide

db = SessionLocal()
guides = db.query(HeritageGuide).all()
for g in guides:
    g.status = 'approved'
db.commit()
print("Approved", len(guides), "guides")
