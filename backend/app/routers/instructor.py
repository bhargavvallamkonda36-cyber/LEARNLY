from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import require_roles

from app.models.user import User

from app.models.course import (
    Course,
    Module,
    Lecture,
    Enrollment,
    LectureProgress,
)

from app.models.quiz import (
    Quiz,
    QuizAttempt,
)


# ============================================================
# ROUTER
# ============================================================

router = APIRouter(
    prefix="/api/v1/instructor",
    tags=["Instructor"],
)


# ============================================================
# HELPER - CHECK ADMIN
# ============================================================

def is_admin_user(user: User) -> bool:
    return any(
        role.name == "admin"
        for role in user.roles
    )


# ============================================================
# HELPER - GET INSTRUCTOR COURSES
# ============================================================

def get_instructor_courses(
    current_user: User,
    db: Session,
):
    query = db.query(Course)

    if not is_admin_user(current_user):
        query = query.filter(
            Course.instructor_id == current_user.id
        )

    return query.all()


# ============================================================
# INSTRUCTOR DASHBOARD
# ============================================================

@router.get("/dashboard")
def instructor_dashboard(
    current_user: User = Depends(
        require_roles(
            "instructor",
            "admin",
        )
    ),
    db: Session = Depends(get_db),
):

    courses = get_instructor_courses(
        current_user,
        db,
    )

    total_courses = len(courses)

    published_courses = sum(
        1
        for course in courses
        if course.status == "approved"
    )

    pending_courses = sum(
        1
        for course in courses
        if course.status == "pending"
    )

    rejected_courses = sum(
        1
        for course in courses
        if course.status == "rejected"
    )

    course_ids = [
        course.id
        for course in courses
    ]

    if course_ids:

        total_modules = (
            db.query(
                func.count(Module.id)
            )
            .filter(
                Module.course_id.in_(
                    course_ids
                )
            )
            .scalar()
            or 0
        )

        total_lectures = (
            db.query(
                func.count(Lecture.id)
            )
            .join(
                Module,
                Module.id == Lecture.module_id,
            )
            .filter(
                Module.course_id.in_(
                    course_ids
                )
            )
            .scalar()
            or 0
        )

        total_students = (
            db.query(
                func.count(
                    func.distinct(
                        Enrollment.user_id
                    )
                )
            )
            .filter(
                Enrollment.course_id.in_(
                    course_ids
                )
            )
            .scalar()
            or 0
        )

    else:

        total_modules = 0
        total_lectures = 0
        total_students = 0

    return {
        "total_courses": total_courses,
        "published_courses": published_courses,
        "pending_courses": pending_courses,
        "rejected_courses": rejected_courses,
        "total_students": int(total_students),
        "total_modules": int(total_modules),
        "total_lectures": int(total_lectures),
    }


# ============================================================
# MY COURSES
# ============================================================

@router.get("/courses")
def instructor_courses(
    current_user: User = Depends(
        require_roles(
            "instructor",
            "admin",
        )
    ),
    db: Session = Depends(get_db),
):

    courses = (
        db.query(Course)
        .filter(
            Course.instructor_id == current_user.id
        )
        .order_by(
            Course.created_at.desc()
        )
        .all()
    )

    if is_admin_user(current_user):
        courses = (
            db.query(Course)
            .order_by(
                Course.created_at.desc()
            )
            .all()
        )

    result = []

    for course in courses:

        module_count = (
            db.query(
                func.count(Module.id)
            )
            .filter(
                Module.course_id == course.id
            )
            .scalar()
            or 0
        )

        lecture_count = (
            db.query(
                func.count(Lecture.id)
            )
            .join(
                Module,
                Module.id == Lecture.module_id,
            )
            .filter(
                Module.course_id == course.id
            )
            .scalar()
            or 0
        )

        student_count = (
            db.query(
                func.count(
                    func.distinct(
                        Enrollment.user_id
                    )
                )
            )
            .filter(
                Enrollment.course_id == course.id
            )
            .scalar()
            or 0
        )

        result.append({

            "id": str(course.id),

            "instructor_id": str(
                course.instructor_id
            ),

            "title": course.title,

            "description": course.description,

            "category": course.category,

            "difficulty": course.difficulty,

            "thumbnail_url": course.thumbnail_url,

            "price": float(
                course.price or 0
            ),

            "status": course.status,

            "created_at": course.created_at,

            "module_count": int(
                module_count
            ),

            "lecture_count": int(
                lecture_count
            ),

            "student_count": int(
                student_count
            ),
        })

    return result


# ============================================================
# INSTRUCTOR ANALYTICS - OVERVIEW
# ============================================================

@router.get("/analytics/overview")
def instructor_analytics_overview(
    current_user: User = Depends(
        require_roles(
            "instructor",
            "admin",
        )
    ),
    db: Session = Depends(get_db),
):

    courses = get_instructor_courses(
        current_user,
        db,
    )

    course_ids = [
        course.id
        for course in courses
    ]

    if not course_ids:

        return {
            "total_courses": 0,
            "published_courses": 0,
            "total_students": 0,
            "total_enrollments": 0,
            "total_modules": 0,
            "total_lectures": 0,
            "completed_lectures": 0,
            "average_progress": 0,
            "total_quiz_attempts": 0,
            "average_quiz_score": 0,
            "highest_quiz_score": 0,
            "passed_quizzes": 0,
            "failed_quizzes": 0,
        }

    total_courses = len(courses)

    published_courses = sum(
        1
        for course in courses
        if course.status == "approved"
    )

    total_enrollments = (
        db.query(
            func.count(Enrollment.id)
        )
        .filter(
            Enrollment.course_id.in_(
                course_ids
            )
        )
        .scalar()
        or 0
    )

    total_students = (
        db.query(
            func.count(
                func.distinct(
                    Enrollment.user_id
                )
            )
        )
        .filter(
            Enrollment.course_id.in_(
                course_ids
            )
        )
        .scalar()
        or 0
    )

    total_modules = (
        db.query(
            func.count(Module.id)
        )
        .filter(
            Module.course_id.in_(
                course_ids
            )
        )
        .scalar()
        or 0
    )

    total_lectures = (
        db.query(
            func.count(Lecture.id)
        )
        .join(
            Module,
            Module.id == Lecture.module_id,
        )
        .filter(
            Module.course_id.in_(
                course_ids
            )
        )
        .scalar()
        or 0
    )

    completed_lectures = (
        db.query(
            func.count(LectureProgress.id)
        )
        .join(
            Lecture,
            Lecture.id == LectureProgress.lecture_id,
        )
        .join(
            Module,
            Module.id == Lecture.module_id,
        )
        .filter(
            Module.course_id.in_(
                course_ids
            )
        )
        .scalar()
        or 0
    )

    average_progress = (
        db.query(
            func.avg(
                Enrollment.progress_percent
            )
        )
        .filter(
            Enrollment.course_id.in_(
                course_ids
            )
        )
        .scalar()
        or 0
    )

    quiz_rows = (
        db.query(
            QuizAttempt.score
        )
        .join(
            Quiz,
            Quiz.id == QuizAttempt.quiz_id,
        )
        .filter(
            Quiz.course_id.in_(
                course_ids
            )
        )
        .all()
    )

    scores = [
        float(row[0])
        for row in quiz_rows
        if row[0] is not None
    ]

    total_quiz_attempts = len(scores)

    average_quiz_score = (
        round(
            sum(scores) / len(scores),
            2,
        )
        if scores
        else 0
    )

    highest_quiz_score = (
        max(scores)
        if scores
        else 0
    )

    passed_quizzes = sum(
        1
        for score in scores
        if score >= 50
    )

    failed_quizzes = (
        total_quiz_attempts -
        passed_quizzes
    )

    return {

        "total_courses":
            total_courses,

        "published_courses":
            published_courses,

        "total_students":
            int(total_students),

        "total_enrollments":
            int(total_enrollments),

        "total_modules":
            int(total_modules),

        "total_lectures":
            int(total_lectures),

        "completed_lectures":
            int(completed_lectures),

        "average_progress":
            round(
                float(
                    average_progress
                ),
                2,
            ),

        "total_quiz_attempts":
            total_quiz_attempts,

        "average_quiz_score":
            average_quiz_score,

        "highest_quiz_score":
            round(
                float(
                    highest_quiz_score
                ),
                2,
            ),

        "passed_quizzes":
            passed_quizzes,

        "failed_quizzes":
            failed_quizzes,
    }


# ============================================================
# INSTRUCTOR ANALYTICS - COURSE PERFORMANCE
# ============================================================

@router.get("/analytics/courses")
def instructor_analytics_courses(
    current_user: User = Depends(
        require_roles(
            "instructor",
            "admin",
        )
    ),
    db: Session = Depends(get_db),
):

    courses = get_instructor_courses(
        current_user,
        db,
    )

    result = []

    for course in courses:

        enrollments = (
            db.query(Enrollment)
            .filter(
                Enrollment.course_id == course.id
            )
            .all()
        )

        student_count = len(
            enrollments
        )

        average_progress = (
            sum(
                float(
                    enrollment.progress_percent
                    or 0
                )
                for enrollment in enrollments
            )
            / student_count
            if student_count
            else 0
        )

        completed_students = sum(
            1
            for enrollment in enrollments
            if float(
                enrollment.progress_percent
                or 0
            ) >= 100
        )

        modules_count = (
            db.query(
                func.count(Module.id)
            )
            .filter(
                Module.course_id == course.id
            )
            .scalar()
            or 0
        )

        lectures_count = (
            db.query(
                func.count(Lecture.id)
            )
            .join(
                Module,
                Module.id == Lecture.module_id,
            )
            .filter(
                Module.course_id == course.id
            )
            .scalar()
            or 0
        )

        quiz_attempts = (
            db.query(
                QuizAttempt
            )
            .join(
                Quiz,
                Quiz.id == QuizAttempt.quiz_id,
            )
            .filter(
                Quiz.course_id == course.id
            )
            .all()
        )

        quiz_scores = [
            float(
                attempt.score or 0
            )
            for attempt in quiz_attempts
        ]

        average_quiz_score = (
            sum(quiz_scores) /
            len(quiz_scores)
            if quiz_scores
            else 0
        )

        result.append({

            "course_id":
                str(course.id),

            "course_title":
                course.title,

            "status":
                course.status,

            "students":
                student_count,

            "completed_students":
                completed_students,

            "completion_rate":
                round(
                    (
                        completed_students /
                        student_count
                    ) * 100,
                    2,
                )
                if student_count
                else 0,

            "average_progress":
                round(
                    average_progress,
                    2,
                ),

            "modules":
                int(modules_count),

            "lectures":
                int(lectures_count),

            "quiz_attempts":
                len(quiz_attempts),

            "average_quiz_score":
                round(
                    average_quiz_score,
                    2,
                ),
        })

    result.sort(
        key=lambda item:
        item["students"],
        reverse=True,
    )

    return result


# ============================================================
# INSTRUCTOR ANALYTICS - STUDENTS
# ============================================================

@router.get("/analytics/students")
def instructor_analytics_students(
    current_user: User = Depends(
        require_roles(
            "instructor",
            "admin",
        )
    ),
    db: Session = Depends(get_db),
):

    courses = get_instructor_courses(
        current_user,
        db,
    )

    course_ids = [
        course.id
        for course in courses
    ]

    if not course_ids:
        return []

    enrollments = (
        db.query(Enrollment)
        .filter(
            Enrollment.course_id.in_(
                course_ids
            )
        )
        .all()
    )

    result = []

    for enrollment in enrollments:

        student = (
            db.query(User)
            .filter(
                User.id == enrollment.user_id
            )
            .first()
        )

        course = (
            db.query(Course)
            .filter(
                Course.id ==
                enrollment.course_id
            )
            .first()
        )

        if not student or not course:
            continue

        attempts = (
            db.query(
                QuizAttempt
            )
            .join(
                Quiz,
                Quiz.id == QuizAttempt.quiz_id,
            )
            .filter(
                Quiz.course_id == course.id,
                QuizAttempt.user_id ==
                    student.id,
            )
            .all()
        )

        scores = [
            float(
                attempt.score or 0
            )
            for attempt in attempts
        ]

        average_quiz_score = (
            sum(scores) /
            len(scores)
            if scores
            else 0
        )

        completed_lectures = (
            db.query(
                func.count(
                    LectureProgress.id
                )
            )
            .join(
                Lecture,
                Lecture.id ==
                    LectureProgress.lecture_id,
            )
            .join(
                Module,
                Module.id ==
                    Lecture.module_id,
            )
            .filter(
                LectureProgress.user_id ==
                    student.id,

                Module.course_id ==
                    course.id,
            )
            .scalar()
            or 0
        )

        total_lectures = (
            db.query(
                func.count(Lecture.id)
            )
            .join(
                Module,
                Module.id ==
                    Lecture.module_id,
            )
            .filter(
                Module.course_id ==
                    course.id,
            )
            .scalar()
            or 0
        )

        result.append({

            "student_id":
                str(student.id),

            "student_name":
                student.full_name or
                student.username or
                student.email,

            "email":
                student.email,

            "course_id":
                str(course.id),

            "course_title":
                course.title,

            "progress":
                round(
                    float(
                        enrollment.progress_percent
                        or 0
                    ),
                    2,
                ),

            "completed_lectures":
                int(
                    completed_lectures
                ),

            "total_lectures":
                int(
                    total_lectures
                ),

            "quiz_attempts":
                len(attempts),

            "average_quiz_score":
                round(
                    average_quiz_score,
                    2,
                ),

            "status":
                (
                    "Completed"
                    if float(
                        enrollment.progress_percent
                        or 0
                    ) >= 100
                    else
                    "In Progress"
                    if float(
                        enrollment.progress_percent
                        or 0
                    ) > 0
                    else
                    "Not Started"
                ),
        })

    result.sort(
        key=lambda item:
        item["progress"],
        reverse=True,
    )

    return result


# ============================================================
# INSTRUCTOR ANALYTICS - QUIZZES
# ============================================================

@router.get("/analytics/quizzes")
def instructor_analytics_quizzes(
    current_user: User = Depends(
        require_roles(
            "instructor",
            "admin",
        )
    ),
    db: Session = Depends(get_db),
):

    courses = get_instructor_courses(
        current_user,
        db,
    )

    course_ids = [
        course.id
        for course in courses
    ]

    if not course_ids:
        return []

    quizzes = (
        db.query(Quiz)
        .filter(
            Quiz.course_id.in_(
                course_ids
            )
        )
        .all()
    )

    result = []

    for quiz in quizzes:

        course = (
            db.query(Course)
            .filter(
                Course.id ==
                quiz.course_id
            )
            .first()
        )

        attempts = (
            db.query(
                QuizAttempt
            )
            .filter(
                QuizAttempt.quiz_id ==
                    quiz.id
            )
            .all()
        )

        scores = [
            float(
                attempt.score or 0
            )
            for attempt in attempts
        ]

        average_score = (
            sum(scores) /
            len(scores)
            if scores
            else 0
        )

        highest_score = (
            max(scores)
            if scores
            else 0
        )

        passed = sum(
            1
            for score in scores
            if score >= 50
        )

        result.append({

            "quiz_id":
                str(quiz.id),

            "quiz_title":
                quiz.title,

            "course_id":
                str(quiz.course_id),

            "course_title":
                course.title
                if course
                else "Unknown Course",

            "question_count":
                quiz.question_count,

            "attempts":
                len(attempts),

            "average_score":
                round(
                    average_score,
                    2,
                ),

            "highest_score":
                round(
                    highest_score,
                    2,
                ),

            "passed":
                passed,

            "failed":
                len(attempts) - passed,
        })

    result.sort(
        key=lambda item:
        item["attempts"],
        reverse=True,
    )

    return result


# ============================================================
# RECENT QUIZ ATTEMPTS
# ============================================================

@router.get("/analytics/recent-attempts")
def instructor_recent_quiz_attempts(
    current_user: User = Depends(
        require_roles(
            "instructor",
            "admin",
        )
    ),
    db: Session = Depends(get_db),
):

    courses = get_instructor_courses(
        current_user,
        db,
    )

    course_ids = [
        course.id
        for course in courses
    ]

    if not course_ids:
        return []

    attempts = (
        db.query(
            QuizAttempt,
            Quiz,
            User,
            Course,
        )
        .join(
            Quiz,
            Quiz.id == QuizAttempt.quiz_id,
        )
        .join(
            User,
            User.id == QuizAttempt.user_id,
        )
        .join(
            Course,
            Course.id == Quiz.course_id,
        )
        .filter(
            Quiz.course_id.in_(
                course_ids
            )
        )
        .order_by(
            QuizAttempt.id.desc()
        )
        .limit(10)
        .all()
    )

    result = []

    for attempt, quiz, student, course in attempts:

        result.append({

            "attempt_id":
                str(attempt.id),

            "quiz_id":
                str(quiz.id),

            "quiz_title":
                quiz.title,

            "course_id":
                str(course.id),

            "course_title":
                course.title,

            "student_id":
                str(student.id),

            "student_name":
                student.full_name or
                student.username or
                student.email,

            "score":
                float(
                    attempt.score or 0
                ),

            "correct_answers":
                int(
                    attempt.correct_answers or 0
                ),

            "total_questions":
                int(
                    attempt.total_questions or 0
                ),
        })

    return result
