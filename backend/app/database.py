import os
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

load_dotenv()

# PostgreSQL is the intended persistent database for this platform (with PostGIS
# providing geographic/spatial capabilities). Point DATABASE_URL at a PostgreSQL
# instance to use it, e.g.:
#   DATABASE_URL=postgresql+psycopg2://culture:culture@localhost:5432/culture
# A local SQLite file remains the zero-configuration fallback for the prototype.
DB_FILE = Path(__file__).resolve().parents[2] / "data" / "processed" / "heritage.db"
SQLALCHEMY_DATABASE_URL = os.environ.get("DATABASE_URL") or f"sqlite:///{DB_FILE.as_posix()}"

connect_args = {}
if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    DB_FILE.parent.mkdir(parents=True, exist_ok=True)
    connect_args = {"check_same_thread": False}

engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args=connect_args)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()