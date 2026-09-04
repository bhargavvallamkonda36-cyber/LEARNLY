from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user

from app.models.learning_activity import LearningActivity
from app.models.course import Enrollment, Course

from app.models.quiz import (
    Quiz,
    QuizAttempt,
)


# ============================================================
# ROUTER
# ============================================================

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"],
)


# ============================================================
# TIMEZONE
# ============================================================

INDIA_TZ = ZoneInfo("Asia/Kolkata")


# ============================================================
# HELPERS
# ============================================================

def get_learning_date():
    """
    Return today's calendar date in India.
    """

    return datetime.now(
        INDIA_TZ
    ).date()


def normalize_progress(value):
    """
    Safely convert progress to a value between 0 and 100.
    """

    try:
        value = float(
            value or 0
        )
    except (
        TypeError,
        ValueError,
    ):
        value = 0

    return max(
        0,
        min(
            100,
            value,
        ),
    )


def activity_to_india_date(created_at):
    """
    Convert an activity timestamp into an India
    calendar date.
    """

    if not created_at:
        return None

    if created_at.tzinfo is not None:
        created_at = created_at.astimezone(
            INDIA_TZ
        )

    return created_at.date()


# ============================================================
# LEARNING STREAK
# ============================================================

def calculate_learning_streak(
    db: Session,
    user_id: str,
):
    """
    Calculate consecutive learning days.
    """

    activities = (
        db.query(
            LearningActivity.created_at
        )
        .filter(
            LearningActivity.user_id
            == user_id
        )
        .all()
    )

    if not activities:
        return {
            "streak": 0,
            "today_active": False,
            "last_learning_date": None,
        }

    activity_dates = set()

    for activity in activities:

        activity_date = (
            activity_to_india_date(
                activity.created_at
            )
        )

        if activity_date:
            activity_dates.add(
                activity_date
            )

    if not activity_dates:
        return {
            "streak": 0,
            "today_active": False,
            "last_learning_date": None,
        }

    today = get_learning_date()

    today_active = (
        today in activity_dates
    )

    last_learning_date = max(
        activity_dates
    )

    # --------------------------------------------------------
    # If user didn't learn today, current streak is zero.
    # --------------------------------------------------------

    if not today_active:
        return {
            "streak": 0,
            "today_active": False,
            "last_learning_date":
                last_learning_date.isoformat(),
        }

    # --------------------------------------------------------
    # Calculate consecutive days.
    # --------------------------------------------------------

    streak = 0
    current_date = today

    while current_date in activity_dates:

        streak += 1

        current_date -= timedelta(
            days=1
        )

    return {
        "streak": streak,
        "today_active": True,
        "last_learning_date":
            today.isoformat(),
    }


# ============================================================
# RECORD LEARNING ACTIVITY
# ============================================================

@router.post("/activity")
def record_learning_activity(
    activity_type: str = "course_learning",

    course_id: str | None = None,

    db: Session = Depends(get_db),

    current_user=Depends(
        get_current_user
    ),
):
    """
    Record a learning activity.
    """

    activity = LearningActivity(
        user_id=current_user.id,
        course_id=course_id,
        activity_type=activity_type,
    )

    db.add(activity)

    db.commit()

    db.refresh(activity)

    streak_data = calculate_learning_streak(
        db=db,
        user_id=current_user.id,
    )

    return {
        "success": True,

        "message":
            "Learning activity recorded.",

        "activity_id":
            str(activity.id),

        "activity_type":
            activity_type,

        "course_id":
            course_id,

        "streak":
            streak_data["streak"],

        "learning_streak":
            streak_data["streak"],

        "learning_streak_days":
            streak_data["streak"],

        "current_streak":
            streak_data["streak"],

        "today_active":
            streak_data["today_active"],

        "last_learning_date":
            streak_data[
                "last_learning_date"
            ],
    }


# ============================================================
# GET LEARNING STREAK
# ============================================================

@router.get("/streak")
def get_learning_streak(
    db: Session = Depends(get_db),

    current_user=Depends(
        get_current_user
    ),
):
    """
    Return current learning streak.
    """

    return calculate_learning_streak(
        db=db,
        user_id=current_user.id,
    )


# ============================================================
# DASHBOARD STATS
# ============================================================

@router.get("/stats")
def get_dashboard_stats(
    db: Session = Depends(get_db),

    current_user=Depends(
        get_current_user
    ),
):
    """
    Return primary dashboard statistics.
    """

    enrollments = (
        db.query(Enrollment)
        .filter(
            Enrollment.user_id
            == current_user.id
        )
        .all()
    )

    total_courses = len(
        enrollments
    )

    completed_courses = 0

    in_progress_courses = 0

    total_progress = 0.0

    for enrollment in enrollments:

        progress = normalize_progress(
            enrollment.progress_percent
        )

        total_progress += progress

        if progress >= 100:

            completed_courses += 1

        elif progress > 0:

            in_progress_courses += 1

    overall_progress = (
        round(
            total_progress
            / total_courses
        )
        if total_courses > 0
        else 0
    )

    streak_data = calculate_learning_streak(
        db=db,
        user_id=current_user.id,
    )

    # --------------------------------------------------------
    # Quiz statistics
    # --------------------------------------------------------

    quiz_attempts = (
        db.query(QuizAttempt)
        .filter(
            QuizAttempt.user_id
            == current_user.id
        )
        .all()
    )

    total_quiz_attempts = len(
        quiz_attempts
    )

    quiz_scores = []

    for attempt in quiz_attempts:

        try:
            score = float(
                attempt.score or 0
            )
        except (
            TypeError,
            ValueError,
        ):
            score = 0

        quiz_scores.append(
            max(
                0,
                min(
                    100,
                    score,
                ),
            )
        )

    average_quiz_score = (
        round(
            sum(quiz_scores)
            / len(quiz_scores),
            2,
        )
        if quiz_scores
        else 0
    )

    highest_quiz_score = (
        round(
            max(quiz_scores),
            2,
        )
        if quiz_scores
        else 0
    )

    passed_quizzes = sum(
        1
        for score in quiz_scores
        if score >= 50
    )

    failed_quizzes = (
        total_quiz_attempts
        - passed_quizzes
    )

    return {

        # ----------------------------------------------------
        # Courses
        # ----------------------------------------------------

        "total_courses":
            total_courses,

        "courses_count":
            total_courses,

        "completed_courses":
            completed_courses,

        "completed_courses_count":
            completed_courses,

        "in_progress_courses":
            in_progress_courses,

        "active_courses":
            in_progress_courses,

        # ----------------------------------------------------
        # Progress
        # ----------------------------------------------------

        "overall_progress":
            overall_progress,

        "progress_percent":
            overall_progress,

        # ----------------------------------------------------
        # Streak
        # ----------------------------------------------------

        "learning_streak":
            streak_data["streak"],

        "streak":
            streak_data["streak"],

        "learning_streak_days":
            streak_data["streak"],

        "current_streak":
            streak_data["streak"],

        "today_active":
            streak_data["today_active"],

        "last_learning_date":
            streak_data[
                "last_learning_date"
            ],

        # ----------------------------------------------------
        # Quiz
        # ----------------------------------------------------

        "total_quiz_attempts":
            total_quiz_attempts,

        "quiz_attempts":
            total_quiz_attempts,

        "average_quiz_score":
            average_quiz_score,

        "highest_quiz_score":
            highest_quiz_score,

        "passed_quizzes":
            passed_quizzes,

        "failed_quizzes":
            failed_quizzes,
    }


# ============================================================
# COURSE PROGRESS ANALYTICS
# ============================================================

@router.get("/progress")
def get_dashboard_progress(
    db: Session = Depends(get_db),

    current_user=Depends(
        get_current_user
    ),
):
    """
    Return progress for every course in which
    the current student is enrolled.
    """

    enrollments = (
        db.query(Enrollment)
        .filter(
            Enrollment.user_id
            == current_user.id
        )
        .all()
    )

    if not enrollments:
        return {
            "courses": [],
            "overall_progress": 0,
            "total_courses": 0,
        }

    course_ids = [
        enrollment.course_id
        for enrollment in enrollments
    ]

    courses = (
        db.query(Course)
        .filter(
            Course.id.in_(course_ids)
        )
        .all()
    )

    course_map = {
        str(course.id): course
        for course in courses
    }

    result = []

    total_progress = 0.0

    for enrollment in enrollments:

        progress = normalize_progress(
            enrollment.progress_percent
        )

        total_progress += progress

        course = course_map.get(
            str(enrollment.course_id)
        )

        result.append({

            "course_id":
                str(enrollment.course_id),

            "course_title":
                getattr(
                    course,
                    "title",
                    "Untitled Course",
                )
                if course
                else "Untitled Course",

            "progress_percent":
                round(
                    progress,
                    2,
                ),

            "status":
                (
                    "completed"
                    if progress >= 100
                    else "in_progress"
                    if progress > 0
                    else "not_started"
                ),
        })

    overall_progress = (
        round(
            total_progress
            / len(enrollments),
            2,
        )
        if enrollments
        else 0
    )

    return {
        "courses": result,
        "overall_progress":
            overall_progress,
        "total_courses":
            len(enrollments),
    }


# ============================================================
# QUIZ PERFORMANCE ANALYTICS
# ============================================================

@router.get("/quiz-performance")
def get_quiz_performance(
    db: Session = Depends(get_db),

    current_user=Depends(
        get_current_user
    ),
):
    """
    Return quiz performance and recent attempts.
    """

    attempts = (
        db.query(QuizAttempt)
        .filter(
            QuizAttempt.user_id
            == current_user.id
        )
        .all()
    )

    if not attempts:
        return {
            "total_attempts": 0,
            "average_score": 0,
            "highest_score": 0,
            "lowest_score": 0,
            "passed": 0,
            "failed": 0,
            "recent_attempts": [],
        }

    scores = []

    for attempt in attempts:

        try:
            score = float(
                attempt.score or 0
            )
        except (
            TypeError,
            ValueError,
        ):
            score = 0

        score = max(
            0,
            min(
                100,
                score,
            ),
        )

        scores.append(score)

    average_score = round(
        sum(scores)
        / len(scores),
        2,
    )

    highest_score = round(
        max(scores),
        2,
    )

    lowest_score = round(
        min(scores),
        2,
    )

    passed = sum(
        1
        for score in scores
        if score >= 50
    )

    failed = (
        len(scores)
        - passed
    )

    # --------------------------------------------------------
    # Load quiz information
    # --------------------------------------------------------

    quiz_ids = list(
        {
            str(attempt.quiz_id)
            for attempt in attempts
        }
    )

    quizzes = []

    if quiz_ids:

        quizzes = (
            db.query(Quiz)
            .filter(
                Quiz.id.in_(quiz_ids)
            )
            .all()
        )

    quiz_map = {
        str(quiz.id): quiz
        for quiz in quizzes
    }

    # --------------------------------------------------------
    # Sort newest first when created_at exists.
    # --------------------------------------------------------

    created_at_column = getattr(
        QuizAttempt,
        "created_at",
        None,
    )

    if created_at_column is not None:

        attempts = sorted(
            attempts,
            key=lambda item:
                item.created_at
                or datetime.min,
            reverse=True,
        )

    else:

        attempts = list(
            reversed(attempts)
        )

    # --------------------------------------------------------
    # Recent attempts
    # --------------------------------------------------------

    recent_attempts = []

    for attempt in attempts[:10]:

        quiz = quiz_map.get(
            str(attempt.quiz_id)
        )

        try:
            score = float(
                attempt.score or 0
            )
        except (
            TypeError,
            ValueError,
        ):
            score = 0

        item = {

            "attempt_id":
                str(attempt.id),

            "quiz_id":
                str(attempt.quiz_id),

            "quiz_title":
                getattr(
                    quiz,
                    "title",
                    "Quiz",
                )
                if quiz
                else "Quiz",

            "score":
                round(
                    max(
                        0,
                        min(
                            100,
                            score,
                        ),
                    ),
                    2,
                ),

            "correct_answers":
                int(
                    attempt.correct_answers
                    or 0
                ),

            "total_questions":
                int(
                    attempt.total_questions
                    or 0
                ),

            "passed":
                score >= 50,
        }

        if getattr(
            attempt,
            "created_at",
            None,
        ):

            created_at = (
                attempt.created_at
            )

            if created_at.tzinfo is not None:

                created_at = (
                    created_at.astimezone(
                        INDIA_TZ
                    )
                )

            item["created_at"] = (
                created_at.isoformat()
            )

        else:

            item["created_at"] = None

        recent_attempts.append(
            item
        )

    return {

        "total_attempts":
            len(scores),

        "average_score":
            average_score,

        "highest_score":
            highest_score,

        "lowest_score":
            lowest_score,

        "passed":
            passed,

        "failed":
            failed,

        "recent_attempts":
            recent_attempts,
    }


# ============================================================
# LEARNING ACTIVITY ANALYTICS
# ============================================================

@router.get("/activity")
def get_dashboard_activity(
    days: int = 14,

    db: Session = Depends(get_db),

    current_user=Depends(
        get_current_user
    ),
):
    """
    Return daily learning activity.

    Default:
        Last 14 days.
    """

    # --------------------------------------------------------
    # Protect against unreasonable values.
    # --------------------------------------------------------

    days = max(
        1,
        min(
            90,
            days,
        ),
    )

    today = get_learning_date()

    start_date = (
        today
        - timedelta(
            days=days - 1
        )
    )

    activities = (
        db.query(LearningActivity)
        .filter(
            LearningActivity.user_id
            == current_user.id
        )
        .all()
    )

    daily_counts = {}

    for activity in activities:

        activity_date = (
            activity_to_india_date(
                activity.created_at
            )
        )

        if not activity_date:
            continue

        if (
            activity_date
            < start_date
            or activity_date
            > today
        ):
            continue

        daily_counts[
            activity_date
        ] = (
            daily_counts.get(
                activity_date,
                0,
            )
            + 1
        )

    result = []

    for offset in range(days):

        current_date = (
            start_date
            + timedelta(
                days=offset
            )
        )

        result.append({

            "date":
                current_date.isoformat(),

            "day":
                current_date.strftime(
                    "%a"
                ),

            "activity_count":
                daily_counts.get(
                    current_date,
                    0,
                ),

            "active":
                daily_counts.get(
                    current_date,
                    0,
                )
                > 0,
        })

    total_activity = sum(
        item["activity_count"]
        for item in result
    )

    active_days = sum(
        1
        for item in result
        if item["active"]
    )

    return {

        "days":
            days,

        "total_activity":
            total_activity,

        "active_days":
            active_days,

        "activity":
            result,
    }
