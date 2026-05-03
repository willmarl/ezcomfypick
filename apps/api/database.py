from sqlmodel import SQLModel, Field, create_engine, Session
from pathlib import Path

class ImageTag(SQLModel, table=True):
    image_path: str = Field(primary_key=True)
    tag: str = Field(primary_key=True)

_engine = None

def init_db(db_path: Path):
    global _engine
    _engine = create_engine(f"sqlite:///{db_path}", connect_args={"check_same_thread": False})
    SQLModel.metadata.create_all(_engine)

def get_session():
    if _engine is None:
        raise RuntimeError("Database not initialized. Call init_db() first.")
    with Session(_engine) as session:
        yield session
