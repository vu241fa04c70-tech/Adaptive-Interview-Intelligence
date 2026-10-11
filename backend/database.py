import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

DB_URL = os.environ.get("DATABASE_URL", "sqlite:///./proofhire.db")

# For SQLite, set check_same_thread=False
connect_args = {"check_same_thread": False} if DB_URL.startswith("sqlite") else {}

engine = create_engine(DB_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

from sqlalchemy import text

def run_migrations(engine):
    """Ensures backwards-compatible SQLite column migrations without data loss."""
    with engine.connect() as conn:
        try:
            res = conn.execute(text("PRAGMA table_info(candidates)")).fetchall()
            cols = [row[1] for row in res]
            if cols and "user_id" not in cols:
                conn.execute(text("ALTER TABLE candidates ADD COLUMN user_id VARCHAR(64)"))
                conn.commit()
        except Exception:
            pass

        try:
            res = conn.execute(text("PRAGMA table_info(interview_sessions)")).fetchall()
            cols = [row[1] for row in res]
            if cols and "user_id" not in cols:
                conn.execute(text("ALTER TABLE interview_sessions ADD COLUMN user_id VARCHAR(64)"))
                conn.commit()
        except Exception:
            pass

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

