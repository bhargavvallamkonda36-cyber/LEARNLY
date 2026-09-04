import uuid
from datetime import datetime

from sqlalchemy import (
    String,
    Boolean,
    DateTime,
    ForeignKey,
    Table,
    Column,
)
from sqlalchemy.orm import (
    Mapped,
    mapped_column,
    relationship,
)

from app.database import Base


# ============================================================
# UUID HELPER
# ============================================================

def generate_uuid() -> str:
    return str(uuid.uuid4())


# ============================================================
# USER ↔ ROLE ASSOCIATION TABLE
# ============================================================

user_roles = Table(
    "user_roles",
    Base.metadata,

    Column(
        "user_id",
        String(36),
        ForeignKey(
            "users.id",
            ondelete="CASCADE",
        ),
        primary_key=True,
    ),

    Column(
        "role_id",
        String(36),
        ForeignKey(
            "roles.id",
            ondelete="CASCADE",
        ),
        primary_key=True,
    ),
)


# ============================================================
# ROLE MODEL
# ============================================================

class Role(Base):
    __tablename__ = "roles"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=generate_uuid,
    )

    name: Mapped[str] = mapped_column(
        String(30),
        unique=True,
        nullable=False,
        index=True,
    )

    # --------------------------------------------------------
    # Relationship
    # --------------------------------------------------------

    users = relationship(
        "User",
        secondary=user_roles,
        back_populates="roles",
    )


# ============================================================
# USER MODEL
# ============================================================

class User(Base):
    __tablename__ = "users"

    # ========================================================
    # ACCOUNT INFORMATION
    # ========================================================

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=generate_uuid,
    )

    full_name: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )

    email: Mapped[str] = mapped_column(
        String(180),
        unique=True,
        nullable=False,
        index=True,
    )

    password_hash: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    username: Mapped[str | None] = mapped_column(
        String(100),
        unique=True,
        nullable=True,
        index=True,
    )

    avatar_url: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )

    # ========================================================
    # STUDENT INFORMATION
    # ========================================================

    student_id: Mapped[str | None] = mapped_column(
        String(100),
        unique=True,
        nullable=True,
        index=True,
    )

    phone: Mapped[str | None] = mapped_column(
        String(30),
        nullable=True,
    )

    department: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True,
    )

    year: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )

    college: Mapped[str | None] = mapped_column(
        String(200),
        nullable=True,
    )

    # ========================================================
    # ACCOUNT DATES
    # ========================================================

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    # ========================================================
    # RELATIONSHIPS
    # ========================================================

    roles = relationship(
        "Role",
        secondary=user_roles,
        back_populates="users",
        lazy="joined",
    )

    courses = relationship(
        "Course",
        back_populates="instructor",
    )

    enrollments = relationship(
        "Enrollment",
        foreign_keys="Enrollment.user_id",
        cascade="all, delete-orphan",
    )
    