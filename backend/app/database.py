import os
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

load_dotenv()

# PostgreSQL is the intended persistent database for this platform (with PostGIS
# providing geographic/spatial capabilities). Point DATABASE_URL at a PostgreSQL
# instance to use it, e.g.:
#   DATABASE_URL=postgresql+psycopg2://USER:PASSWORD@localhost:5432/DBNAME
# A local SQLite file remains the zero-configuration fallback for the prototype.
DB_FILE = Path(__file__).resolve().parents[2] / "data" / "processed" / "heritage.db"
target_url = os.environ.get("DATABASE_URL")

def _create_db_engine(url: str):
    connect_args = {}
    if url.startswith("sqlite"):
        DB_FILE.parent.mkdir(parents=True, exist_ok=True)
        connect_args = {"check_same_thread": False}
    return create_engine(url, connect_args=connect_args)

if target_url and target_url.startswith("postgresql"):
    SQLALCHEMY_DATABASE_URL = target_url
    engine = create_engine(target_url, connect_args={"connect_timeout": 10})
else:
    SQLALCHEMY_DATABASE_URL = target_url or f"sqlite:///{DB_FILE.as_posix()}"
    engine = _create_db_engine(SQLALCHEMY_DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()