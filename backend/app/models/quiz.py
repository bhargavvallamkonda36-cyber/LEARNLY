import uuid
from datetime import datetime

from sqlalchemy import (
    String,
    Integer,
    Float,
    DateTime,
    ForeignKey,
    JSON,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


# ============================================================
# UUID HELPER
# ============================================================

def generate_uuid() -> str:
    return str(uuid.uuid4())


# ============================================================
# QUIZ
# ============================================================

class Quiz(Base):
    __tablename__ = "quizzes"

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
        index=True,
    )

    module_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey(
            "modules.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    title: Mapped[str] = mapped_column(
        String(250),
        nullable=False,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    question_count: Mapped[int] = mapped_column(
        Integer,
        default=5,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )


# ============================================================
# QUIZ QUESTION
# ============================================================

class QuizQuestion(Base):
    __tablename__ = "quiz_questions"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=generate_uuid,
    )

    quiz_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey(
            "quizzes.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    question_text: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    options: Mapped[list] = mapped_column(
        JSON,
        nullable=False,
    )

    # Stored only on backend.
    correct_answer: Mapped[str] = mapped_column(
        String(10),
        nullable=False,
    )

    explanation: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    order_index: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )


# ============================================================
# QUIZ ATTEMPT
# ============================================================

class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=generate_uuid,
    )

    quiz_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey(
            "quizzes.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey(
            "users.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    score: Mapped[float] = mapped_column(
        Float,
        default=0,
        nullable=False,
    )

    correct_answers: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )

    total_questions: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )

    completed_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )


# ============================================================
# QUIZ ANSWER
# ============================================================

class QuizAnswer(Base):
    __tablename__ = "quiz_answers"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=generate_uuid,
    )

    attempt_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey(
            "quiz_attempts.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    question_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey(
            "quiz_questions.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    selected_answer: Mapped[str] = mapped_column(
        String(10),
        nullable=False,
    )

    correct: Mapped[bool] = mapped_column(
        default=False,
        nullable=False,
    )
    