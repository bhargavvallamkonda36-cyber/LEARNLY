import uuid
from datetime import datetime
from app.models.user import User

from sqlalchemy import (
    String,
    Text,
    Integer,
    ForeignKey,
    DateTime,
    Numeric,
    JSON,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


# ============================================================
# Helper
# ============================================================

def generate_uuid() -> str:
    return str(uuid.uuid4())


# ============================================================
# COURSE
# ============================================================

class Course(Base):
    __tablename__ = "courses"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=generate_uuid,
    )

    instructor_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id"),
        nullable=False,
    )

    title: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    category: Mapped[str | None] = mapped_column(
        String(80),
        nullable=True,
    )

    difficulty: Mapped[str] = mapped_column(
        String(20),
        default="beginner",
        nullable=False,
    )

    thumbnail_url: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )

    price: Mapped[float] = mapped_column(
        Numeric(10, 2),
        default=0,
        nullable=False,
    )

    status: Mapped[str] = mapped_column(
        String(20),
        default="pending",
        nullable=False,
        index=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    # Relationships
    instructor = relationship(
        "User",
        back_populates="courses",
    )

    modules = relationship(
        "Module",
        back_populates="course",
        cascade="all, delete-orphan",
        order_by="Module.order_index",
    )

    enrollments = relationship(
        "Enrollment",
        back_populates="course",
        cascade="all, delete-orphan",
    )


# ============================================================
# MODULE
# ============================================================

class Module(Base):
    __tablename__ = "modules"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=generate_uuid,
    )

    course_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey(
            "courses.id",
            ondelete="CASCADE",
        ),
        nullable=False,
    )

    title: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
    )

    order_index: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )

    # Relationships
    course = relationship(
        "Course",
        back_populates="modules",
    )

    lectures = relationship(
        "Lecture",
        back_populates="module",
        cascade="all, delete-orphan",
        order_by="Lecture.order_index",
    )


# ============================================================
# LECTURE
# ============================================================

class Lecture(Base):
    __tablename__ = "lectures"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=generate_uuid,
    )

    module_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey(
            "modules.id",
            ondelete="CASCADE",
        ),
        nullable=False,
    )

    title: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    video_url: Mapped[str | None] = mapped_column(
        String(1000),
        nullable=True,
    )

    transcript: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    duration_seconds: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )

    order_index: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )

    # IMPORTANT:
    # PostgreSQL ARRAY(String) was removed.
    # SQLite supports JSON, so resource URLs
    # are stored as a JSON list.
    #
    # Example:
    # [
    #     "https://example.com/file1.pdf",
    #     "https://example.com/file2.pdf"
    # ]
    resource_urls: Mapped[list[str] | None] = mapped_column(
        JSON,
        nullable=True,
        default=list,
    )

    # Relationship
    module = relationship(
        "Module",
        back_populates="lectures",
    )


# ============================================================
# ENROLLMENT
# ============================================================

class Enrollment(Base):
    __tablename__ = "enrollments"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=generate_uuid,
    )

    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey(
            "users.id",
            ondelete="CASCADE",
        ),
        nullable=False,
    )

    course_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey(
            "courses.id",
            ondelete="CASCADE",
        ),
        nullable=False,
    )

    enrolled_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    progress_percent: Mapped[float] = mapped_column(
        Numeric(5, 2),
        default=0,
        nullable=False,
    )

    # Relationship
    course = relationship(
        "Course",
        back_populates="enrollments",
    )


# ============================================================
# LECTURE PROGRESS
# ============================================================

class LectureProgress(Base):
    """
    Stores per-student lecture completion.

    One row means the student has completed that lecture.
    """

    __tablename__ = "lecture_progress"

    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "lecture_id",
            name="uq_lecture_progress_user_lecture",
        ),
    )

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=generate_uuid,
    )

    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey(
            "users.id",
            ondelete="CASCADE",
        ),
        nullable=False,
    )

    lecture_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey(
            "lectures.id",
            ondelete="CASCADE",
        ),
        nullable=False,
    )

    completed_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )
