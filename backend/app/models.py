from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime

from .database import Base


# ==========================================
# CASE MODEL
# ==========================================

class Case(Base):

    __tablename__ = "cases"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    case_name = Column(
        String,
        nullable=False
    )

    description = Column(
        String,
        nullable=True
    )

    status = Column(
        String,
        default="Active"
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )

    evidence = relationship(
        "Evidence",
        back_populates="case"
    )


# ==========================================
# EVIDENCE MODEL
# ==========================================

class Evidence(Base):

    __tablename__ = "evidence"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    file_name = Column(
        String,
        nullable=False
    )

    file_path = Column(
        String,
        nullable=False
    )

    file_type = Column(
        String,
        nullable=True
    )

    file_size = Column(
        Integer,
        nullable=True
    )

    sha256_hash = Column(
        String,
        nullable=False
    )

    uploaded_at = Column(
        DateTime,
        default=datetime.utcnow
    )

    # ==========================================
    # FORENSIC ANALYSIS FIELDS
    # ==========================================

    analysis_status = Column(
        String,
        default="Pending"
    )

    integrity_status = Column(
        String,
        nullable=True
    )

    analysis_result = Column(
        String,
        nullable=True
    )

    analyzed_at = Column(
        DateTime,
        nullable=True
    )

    # ==========================================
    # CASE RELATION
    # ==========================================

    case_id = Column(
        Integer,
        ForeignKey("cases.id"),
        nullable=False
    )

    case = relationship(
        "Case",
        back_populates="evidence"
    )