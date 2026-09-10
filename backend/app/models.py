"""
SQLAlchemy ORM models - these map directly to PostgreSQL tables.

We only need one table for this project: every time an operator clicks
"Generate", we save what was submitted and what came back, so it can be
shown again later in the History panel.
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

    # Relationship to user's generations
    generations = relationship("Generation", back_populates="user", cascade="all, delete-orphan")


class Generation(Base):
    __tablename__ = "generations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    created_at = Column(DateTime, default=datetime.utcnow)

    # User who created this generation
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    user = relationship("User", back_populates="generations")

    # What the operator submitted
    source_type = Column(String, nullable=False)     # "text" | "file" | "image"
    source_preview = Column(Text, nullable=False)     # first ~500 chars, shown in the history list
    file_name = Column(String, nullable=True)

    # What the operator asked for
    output_types = Column(JSON, nullable=False)       # e.g. ["linkedin_post", "advisory"]
    parameters = Column(JSON, nullable=False)         # audience, tone, language, detail_level, objective

    # What the AI produced
    results = Column(JSON, nullable=False)            # { "linkedin_post": {...}, "advisory": {...} }

