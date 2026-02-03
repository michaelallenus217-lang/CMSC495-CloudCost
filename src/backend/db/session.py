"""
File: session.py
Project: Cloud Cost Intelligence Platform
Author: Sean Kellner (Backend Lead)
Created: January 2026
Description: Database session management. Provides scoped session factory
             for SQLAlchemy database operations.
"""

from sqlalchemy.engine import Engine
from sqlalchemy.orm import scoped_session, sessionmaker

SessionLocal = None


def init_session_factory(engine: Engine):
    global SessionLocal
    SessionLocal = scoped_session(
        sessionmaker(autocommit=False, autoflush=False, bind=engine, future=True)
    )


def get_db_session():
    if SessionLocal is None:
        raise RuntimeError("DB session factory not initialized")
    return SessionLocal()


def remove_db_session(exception=None):
    if SessionLocal is not None:
        SessionLocal.remove()
