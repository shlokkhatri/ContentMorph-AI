"""
SQLAlchemy ORM models - these map directly to PostgreSQL tables.
"""

import uuid
from datetime import datetime

from sqlalchemy import Column, String, Text, DateTime, JSON, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    generations = relationship("Generation", back_populates="user", cascade="all, delete-orphan")


class Generation(Base):
    __tablename__ = "generations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    created_at = Column(DateTime, default=datetime.utcnow)

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    user = relationship("User", back_populates="generations")

    source_type = Column(String, nullable=False)      # "text" | "file" | "image"
    source_preview = Column(Text, nullable=False)      # first ~500 chars, shown in the history list
    file_name = Column(String, nullable=True)

    output_types = Column(JSON, nullable=False)        # e.g. ["linkedin_post", "advisory"]
    parameters = Column(JSON, nullable=False)          # audience, tone, language, detail_level, objective
    results = Column(JSON, nullable=False)             # { "linkedin_post": {...}, "advisory": {...} }

    # NEW: maps an output-type key -> a file_id under backend/generated_files/,
    # so downloadable artifacts (currently: "presentation" -> its .pptx) can
    # be found again later for /api/download/{id}/{format}.
    output_files = Column(JSON, nullable=True, default=dict)