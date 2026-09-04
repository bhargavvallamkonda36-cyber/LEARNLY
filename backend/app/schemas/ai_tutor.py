from typing import List, Optional

from pydantic import BaseModel, Field


# ============================================================
# CHAT MESSAGE
# ============================================================

class ChatMessage(BaseModel):
    role: str
    content: str


# ============================================================
# AI TUTOR REQUEST
# ============================================================

class AITutorRequest(BaseModel):

    message: str = Field(
        ...,
        min_length=1,
        max_length=10000,
    )

    course: str = Field(
        default="General",
        max_length=200,
    )

    module: Optional[str] = Field(
        default=None,
        max_length=200,
    )

    history: List[ChatMessage] = Field(
        default_factory=list
    )


# ============================================================
# AI TUTOR RESPONSE
# ============================================================

class AITutorResponse(BaseModel):

    answer: str

    course: str

    module: Optional[str] = None
    