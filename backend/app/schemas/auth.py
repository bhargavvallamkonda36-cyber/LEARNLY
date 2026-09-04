from typing import List, Optional
from datetime import datetime

from pydantic import (
    BaseModel,
    EmailStr,
    Field,
    ConfigDict,
)


# ============================================================
# REGISTER
# ============================================================

class RegisterRequest(BaseModel):
    full_name: str = Field(
        ...,
        min_length=2,
        max_length=150,
    )

    email: EmailStr

    password: str = Field(
        ...,
        min_length=6,
        max_length=128,
    )


# ============================================================
# LOGIN
# ============================================================

class LoginRequest(BaseModel):
    email: EmailStr

    password: str = Field(
        ...,
        min_length=1,
        max_length=128,
    )


# ============================================================
# PROFILE UPDATE
# ============================================================

class ProfileUpdateRequest(BaseModel):

    full_name: str = Field(
        ...,
        min_length=2,
        max_length=150,
    )

    # Email can now be updated
    email: EmailStr

    username: Optional[str] = Field(
        default=None,
        max_length=100,
    )

    student_id: Optional[str] = Field(
        default=None,
        max_length=100,
    )

    phone: Optional[str] = Field(
        default=None,
        max_length=30,
    )

    department: Optional[str] = Field(
        default=None,
        max_length=150,
    )

    year: Optional[str] = Field(
        default=None,
        max_length=50,
    )

    college: Optional[str] = Field(
        default=None,
        max_length=200,
    )

    avatar_url: Optional[str] = Field(
        default=None,
        max_length=1000,
    )


# ============================================================
# USER OUTPUT
# ============================================================

class UserOut(BaseModel):

    model_config = ConfigDict(
        from_attributes=True
    )

    id: str

    full_name: str

    email: str

    roles: List[str] = Field(
        default_factory=list
    )

    # --------------------------------------------------------
    # Student information
    # --------------------------------------------------------

    username: Optional[str] = None

    student_id: Optional[str] = None

    phone: Optional[str] = None

    department: Optional[str] = None

    year: Optional[str] = None

    college: Optional[str] = None

    # --------------------------------------------------------
    # Account information
    # --------------------------------------------------------

    avatar_url: Optional[str] = None

    is_active: bool = True

    created_at: Optional[datetime] = None

    updated_at: Optional[datetime] = None


# ============================================================
# AUTH RESPONSE
# ============================================================

class AuthResponse(BaseModel):

    access_token: str

    token_type: str = "bearer"

    user: UserOut


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
    