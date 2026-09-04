from pydantic import BaseModel, Field


# ============================================================
# GENERATE QUIZ
# ============================================================

class QuizGenerateRequest(BaseModel):

    course_id: str

    module_id: str

    question_count: int = Field(
        default=5,
        ge=3,
        le=20,
    )


# ============================================================
# PUBLIC QUESTION
# ============================================================

class QuizQuestionOut(BaseModel):

    id: str

    question: str

    options: list[str]

    order_index: int


# ============================================================
# QUIZ RESPONSE
# ============================================================

class QuizOut(BaseModel):

    id: str

    course_id: str

    module_id: str

    title: str

    description: str | None = None

    question_count: int

    questions: list[QuizQuestionOut]


# ============================================================
# SUBMIT ANSWER
# ============================================================

class QuizAnswerSubmit(BaseModel):

    question_id: str

    selected_answer: str


# ============================================================
# SUBMIT QUIZ
# ============================================================

class QuizSubmitRequest(BaseModel):

    quiz_id: str

    answers: list[QuizAnswerSubmit]


# ============================================================
# QUESTION RESULT
# ============================================================

class QuizQuestionResult(BaseModel):

    question_id: str

    question: str

    selected_answer: str | None

    correct_answer: str

    correct: bool

    explanation: str | None


# ============================================================
# QUIZ RESULT
# ============================================================

class QuizResult(BaseModel):

    attempt_id: str

    quiz_id: str

    score: float

    correct_answers: int

    total_questions: int

    results: list[QuizQuestionResult]
    