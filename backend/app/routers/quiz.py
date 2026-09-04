import uuid

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
)

from sqlalchemy.orm import Session

from app.database import get_db

from app.dependencies import require_roles

from app.models.user import User

from app.models.course import (
    Course,
    Module,
    Lecture,
    Enrollment,
)

from app.models.quiz import (
    Quiz,
    QuizQuestion,
    QuizAttempt,
    QuizAnswer,
)

from app.schemas.quiz import (
    QuizGenerateRequest,
    QuizOut,
    QuizQuestionOut,
    QuizSubmitRequest,
    QuizResult,
    QuizQuestionResult,
)

from app.services.quiz_service import (
    generate_quiz_questions,
)


# ============================================================
# ROUTER
# ============================================================

router = APIRouter(
    prefix="/api/v1/ai-tutor/quiz",
    tags=["AI Quiz"],
)


# ============================================================
# GENERATE QUIZ
# ============================================================

@router.post(
    "/generate",
    response_model=QuizOut,
)
def generate_quiz(
    request: QuizGenerateRequest,
    user: User = Depends(
        require_roles("student")
    ),
    db: Session = Depends(get_db),
):

    # --------------------------------------------------------
    # Validate IDs
    # --------------------------------------------------------

    try:
        course_id = str(
            uuid.UUID(request.course_id)
        )

        module_id = str(
            uuid.UUID(request.module_id)
        )

    except ValueError:

        raise HTTPException(
            status_code=400,
            detail="Invalid course or module ID",
        )

    # --------------------------------------------------------
    # Course
    # --------------------------------------------------------

    course = (
        db.query(Course)
        .filter(
            Course.id == course_id
        )
        .first()
    )

    if not course:

        raise HTTPException(
            status_code=404,
            detail="Course not found",
        )

    # --------------------------------------------------------
    # Enrollment
    # --------------------------------------------------------

    enrollment = (
        db.query(Enrollment)
        .filter(
            Enrollment.user_id == user.id,
            Enrollment.course_id == course.id,
        )
        .first()
    )

    if not enrollment:

        raise HTTPException(
            status_code=403,
            detail=(
                "You must be enrolled in this course "
                "to generate a quiz."
            ),
        )

    # --------------------------------------------------------
    # Module
    # --------------------------------------------------------

    module = (
        db.query(Module)
        .filter(
            Module.id == module_id,
            Module.course_id == course.id,
        )
        .first()
    )

    if not module:

        raise HTTPException(
            status_code=404,
            detail="Module not found",
        )

    # --------------------------------------------------------
    # Get lectures
    # --------------------------------------------------------

    lectures = (
        db.query(Lecture)
        .filter(
            Lecture.module_id == module.id
        )
        .order_by(
            Lecture.order_index.asc()
        )
        .all()
    )

    if not lectures:

        raise HTTPException(
            status_code=400,
            detail=(
                "This module does not contain "
                "any learning material yet."
            ),
        )

    # --------------------------------------------------------
    # Build learning material
    # --------------------------------------------------------

    content_parts = []

    for lecture in lectures:

        content_parts.append(
            f"""
LECTURE:
{lecture.title}

DESCRIPTION:
{lecture.description or ""}

TRANSCRIPT:
{lecture.transcript or ""}
"""
        )

    lecture_content = "\n\n".join(
        content_parts
    )

    # --------------------------------------------------------
    # Generate with Groq
    # --------------------------------------------------------

    try:

        questions = generate_quiz_questions(
            course_title=course.title,
            module_title=module.title,
            lecture_content=lecture_content,
            question_count=request.question_count,
        )

    except Exception as exc:

        print(
            "Quiz generation error:",
            repr(exc),
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "AI could not generate the quiz. "
                "Check the backend terminal."
            ),
        )

    # --------------------------------------------------------
    # Create Quiz
    # --------------------------------------------------------

    quiz = Quiz(
        course_id=course.id,
        module_id=module.id,
        title=(
            f"{module.title} AI Quiz"
        ),
        description=(
            "AI-generated quiz based on "
            f"{module.title}."
        ),
        question_count=len(
            questions
        ),
    )

    db.add(quiz)

    db.flush()

    # --------------------------------------------------------
    # Create Questions
    # --------------------------------------------------------

    public_questions = []

    for index, item in enumerate(
        questions
    ):

        options = item["options"]

        question = QuizQuestion(
            quiz_id=quiz.id,
            question_text=item["question"],
            options=[
                options["A"],
                options["B"],
                options["C"],
                options["D"],
            ],
            correct_answer=item["correct_answer"],
            explanation=item["explanation"],
            order_index=index,
        )

        db.add(question)

        db.flush()

        public_questions.append(
            QuizQuestionOut(
                id=str(
                    question.id
                ),
                question=question.question_text,
                options=question.options,
                order_index=question.order_index,
            )
        )

    db.commit()

    db.refresh(quiz)

    return QuizOut(
        id=str(quiz.id),
        course_id=str(
            quiz.course_id
        ),
        module_id=str(
            quiz.module_id
        ),
        title=quiz.title,
        description=quiz.description,
        question_count=quiz.question_count,
        questions=public_questions,
    )


# ============================================================
# SUBMIT QUIZ
# ============================================================

@router.post(
    "/submit",
    response_model=QuizResult,
)
def submit_quiz(
    request: QuizSubmitRequest,
    user: User = Depends(
        require_roles("student")
    ),
    db: Session = Depends(get_db),
):

    # --------------------------------------------------------
    # Validate quiz ID
    # --------------------------------------------------------

    try:

        quiz_id = str(
            uuid.UUID(
                request.quiz_id
            )
        )

    except ValueError:

        raise HTTPException(
            status_code=400,
            detail="Invalid quiz ID",
        )

    # --------------------------------------------------------
    # Get quiz
    # --------------------------------------------------------

    quiz = (
        db.query(Quiz)
        .filter(
            Quiz.id == quiz_id
        )
        .first()
    )

    if not quiz:

        raise HTTPException(
            status_code=404,
            detail="Quiz not found",
        )

    # --------------------------------------------------------
    # Verify enrollment
    # --------------------------------------------------------

    enrollment = (
        db.query(Enrollment)
        .filter(
            Enrollment.user_id == user.id,
            Enrollment.course_id == quiz.course_id,
        )
        .first()
    )

    if not enrollment:

        raise HTTPException(
            status_code=403,
            detail="You are not enrolled in this course",
        )

    # --------------------------------------------------------
    # Get questions
    # --------------------------------------------------------

    questions = (
        db.query(QuizQuestion)
        .filter(
            QuizQuestion.quiz_id == quiz.id
        )
        .order_by(
            QuizQuestion.order_index.asc()
        )
        .all()
    )

    if not questions:

        raise HTTPException(
            status_code=400,
            detail="Quiz contains no questions",
        )

    # --------------------------------------------------------
    # Map submitted answers
    # --------------------------------------------------------

    submitted = {
        item.question_id:
            item.selected_answer.upper().strip()
        for item in request.answers
    }

    # --------------------------------------------------------
    # Create attempt
    # --------------------------------------------------------

    attempt = QuizAttempt(
        quiz_id=quiz.id,
        user_id=user.id,
        score=0,
        correct_answers=0,
        total_questions=len(
            questions
        ),
    )

    db.add(attempt)

    db.flush()

    # --------------------------------------------------------
    # Grade quiz
    # --------------------------------------------------------

    correct_count = 0

    results = []

    for question in questions:

        selected = submitted.get(
            str(question.id)
        )

        if selected not in [
            "A",
            "B",
            "C",
            "D",
        ]:

            selected = None

        is_correct = (
            selected ==
            question.correct_answer
        )

        if is_correct:
            correct_count += 1

        answer = QuizAnswer(
            attempt_id=attempt.id,
            question_id=question.id,
            selected_answer=(
                selected or ""
            ),
            correct=is_correct,
        )

        db.add(answer)

        results.append(
            QuizQuestionResult(
                question_id=str(
                    question.id
                ),
                question=question.question_text,
                selected_answer=selected,
                correct_answer=(
                    question.correct_answer
                ),
                correct=is_correct,
                explanation=(
                    question.explanation
                ),
            )
        )

    # --------------------------------------------------------
    # Calculate score
    # --------------------------------------------------------

    total = len(
        questions
    )

    score = round(
        (
            correct_count /
            total
        ) * 100,
        2,
    )

    attempt.correct_answers = (
        correct_count
    )

    attempt.score = score

    db.commit()

    db.refresh(attempt)

    return QuizResult(
        attempt_id=str(
            attempt.id
        ),
        quiz_id=str(
            quiz.id
        ),
        score=score,
        correct_answers=correct_count,
        total_questions=total,
        results=results,
    )


# ============================================================
# QUIZ HISTORY
# ============================================================

@router.get(
    "/history",
)
def get_quiz_history(
    user: User = Depends(
        require_roles("student")
    ),
    db: Session = Depends(get_db),
):

    # --------------------------------------------------------
    # Get all attempts for current student
    # --------------------------------------------------------

    attempts = (
        db.query(QuizAttempt)
        .filter(
            QuizAttempt.user_id == user.id
        )
        .order_by(
            QuizAttempt.completed_at.desc()
        )
        .all()
    )

    history = []

    # --------------------------------------------------------
    # Build history
    # --------------------------------------------------------

    for attempt in attempts:

        quiz = (
            db.query(Quiz)
            .filter(
                Quiz.id == attempt.quiz_id
            )
            .first()
        )

        if not quiz:
            continue

        course = (
            db.query(Course)
            .filter(
                Course.id == quiz.course_id
            )
            .first()
        )

        module = (
            db.query(Module)
            .filter(
                Module.id == quiz.module_id
            )
            .first()
        )

        history.append(
            {
                "attempt_id": str(
                    attempt.id
                ),

                "quiz_id": str(
                    quiz.id
                ),

                "quiz_title": quiz.title,

                "course_id": (
                    str(course.id)
                    if course
                    else None
                ),

                "course_title": (
                    course.title
                    if course
                    else None
                ),

                "module_id": (
                    str(module.id)
                    if module
                    else None
                ),

                "module_title": (
                    module.title
                    if module
                    else None
                ),

                "score": float(
                    attempt.score
                ),

                "correct_answers": (
                    attempt.correct_answers
                ),

                "total_questions": (
                    attempt.total_questions
                ),

                "percentage": float(
                    attempt.score
                ),

                "completed_at": (
                    attempt.completed_at
                    .isoformat()
                    if attempt.completed_at
                    else None
                ),
            }
        )

    # --------------------------------------------------------
    # Response
    # --------------------------------------------------------

    return {
        "student_id": str(
            user.id
        ),

        "total_attempts": len(
            history
        ),

        "attempts": history,
    }


# ============================================================
# QUIZ ATTEMPT DETAILS
# ============================================================

@router.get(
    "/history/{attempt_id}",
)
def get_quiz_attempt(
    attempt_id: str,

    user: User = Depends(
        require_roles("student")
    ),

    db: Session = Depends(get_db),
):

    # --------------------------------------------------------
    # Validate attempt ID
    # --------------------------------------------------------

    try:

        attempt_uuid = str(
            uuid.UUID(
                attempt_id
            )
        )

    except ValueError:

        raise HTTPException(
            status_code=400,
            detail="Invalid attempt ID",
        )

    # --------------------------------------------------------
    # Get attempt
    # --------------------------------------------------------

    attempt = (
        db.query(QuizAttempt)
        .filter(
            QuizAttempt.id ==
                attempt_uuid,

            QuizAttempt.user_id ==
                user.id,
        )
        .first()
    )

    if not attempt:

        raise HTTPException(
            status_code=404,
            detail="Quiz attempt not found",
        )

    # --------------------------------------------------------
    # Get quiz
    # --------------------------------------------------------

    quiz = (
        db.query(Quiz)
        .filter(
            Quiz.id == attempt.quiz_id
        )
        .first()
    )

    if not quiz:

        raise HTTPException(
            status_code=404,
            detail="Quiz not found",
        )

    # --------------------------------------------------------
    # Get course
    # --------------------------------------------------------

    course = (
        db.query(Course)
        .filter(
            Course.id == quiz.course_id
        )
        .first()
    )

    # --------------------------------------------------------
    # Get module
    # --------------------------------------------------------

    module = (
        db.query(Module)
        .filter(
            Module.id == quiz.module_id
        )
        .first()
    )

    # --------------------------------------------------------
    # Get answers
    # --------------------------------------------------------

    answers = (
        db.query(QuizAnswer)
        .filter(
            QuizAnswer.attempt_id ==
                attempt.id
        )
        .all()
    )

    answer_map = {
        str(answer.question_id): answer
        for answer in answers
    }

    # --------------------------------------------------------
    # Get questions
    # --------------------------------------------------------

    questions = (
        db.query(QuizQuestion)
        .filter(
            QuizQuestion.quiz_id ==
                quiz.id
        )
        .order_by(
            QuizQuestion.order_index.asc()
        )
        .all()
    )

    results = []

    for question in questions:

        answer = answer_map.get(
            str(question.id)
        )

        results.append(
            {
                "question_id": str(
                    question.id
                ),

                "question": (
                    question.question_text
                ),

                "options": (
                    question.options
                ),

                "selected_answer": (
                    answer.selected_answer
                    if answer
                    and answer.selected_answer
                    else None
                ),

                "correct_answer": (
                    question.correct_answer
                ),

                "correct": (
                    answer.correct
                    if answer
                    else False
                ),

                "explanation": (
                    question.explanation
                ),

                "order_index": (
                    question.order_index
                ),
            }
        )

    # --------------------------------------------------------
    # Response
    # --------------------------------------------------------

    return {
        "attempt_id": str(
            attempt.id
        ),

        "quiz_id": str(
            quiz.id
        ),

        "quiz_title": quiz.title,

        "course": (
            course.title
            if course
            else None
        ),

        "course_id": (
            str(course.id)
            if course
            else None
        ),

        "module": (
            module.title
            if module
            else None
        ),

        "module_id": (
            str(module.id)
            if module
            else None
        ),

        "score": float(
            attempt.score
        ),

        "correct_answers": (
            attempt.correct_answers
        ),

        "total_questions": (
            attempt.total_questions
        ),

        "percentage": float(
            attempt.score
        ),

        "completed_at": (
            attempt.completed_at.isoformat()
            if attempt.completed_at
            else None
        ),

        "results": results,
    }
