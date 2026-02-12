"""
ResumeGod V4.0 — Database Models
SQLAlchemy ORM schemas for all entities
"""
import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Text, DateTime, Integer, Float,
    ForeignKey, Boolean, JSON, create_engine
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
import os

Base = declarative_base()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./resumegod.db")
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def generate_uuid():
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_uuid)
    email = Column(String, unique=True, nullable=False)
    name = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)

    resumes = relationship("Resume", back_populates="user", cascade="all, delete-orphan")
    sessions = relationship("ConversationSession", back_populates="user", cascade="all, delete-orphan")


class Resume(Base):
    __tablename__ = "resumes"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    original_filename = Column(String, nullable=True)
    raw_text = Column(Text, nullable=True)
    optimized_latex = Column(Text, nullable=True)
    pdf_path = Column(String, nullable=True)
    job_description = Column(Text, nullable=True)
    gap_analysis = Column(JSON, nullable=True)
    ats_score_before = Column(Float, nullable=True)
    ats_score_after = Column(Float, nullable=True)
    tracking_token = Column(String, unique=True, nullable=True, default=generate_uuid)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="resumes")
    tracking_events = relationship("TrackingLog", back_populates="resume", cascade="all, delete-orphan")


class TrackingLog(Base):
    __tablename__ = "tracking_logs"

    id = Column(String, primary_key=True, default=generate_uuid)
    resume_id = Column(String, ForeignKey("resumes.id"), nullable=False)
    event_type = Column(String, default="view")  # view, open, download
    ip_address = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    country = Column(String, nullable=True)
    city = Column(String, nullable=True)
    region = Column(String, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    referer = Column(String, nullable=True)
    company_hint = Column(String, nullable=True)  # reverse-lookup ISP/org
    viewed_at = Column(DateTime, default=datetime.utcnow)

    resume = relationship("Resume", back_populates="tracking_events")


class InterviewSession(Base):
    __tablename__ = "interview_sessions"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    resume_id = Column(String, ForeignKey("resumes.id"), nullable=True)
    questions = Column(JSON, nullable=True)
    answers = Column(JSON, nullable=True)
    overall_score = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class ConversationSession(Base):
    __tablename__ = "conversation_sessions"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    messages = Column(JSON, default=list)
    active_agent = Column(String, default="orchestrator")
    context = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="sessions")


class AffiliateClick(Base):
    __tablename__ = "affiliate_clicks"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=True)
    skill_name = Column(String, nullable=False)
    course_title = Column(String, nullable=True)
    affiliate_url = Column(String, nullable=False)
    clicked_at = Column(DateTime, default=datetime.utcnow)


def create_tables():
    Base.metadata.create_all(bind=engine)


if __name__ == "__main__":
    create_tables()
    print("ResumeGod database initialized.")
