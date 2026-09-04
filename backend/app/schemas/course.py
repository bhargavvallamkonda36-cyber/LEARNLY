from pydantic import BaseModel, Field, HttpUrl
from typing import Optional

class CourseCreate(BaseModel):
    title: str = Field(min_length=2, max_length=200)
    description: Optional[str] = None
    category: Optional[str] = None
    difficulty: str = "beginner"
    thumbnail_url: Optional[str] = None
    price: float = 0

class CourseOut(BaseModel):
    id: str
    instructor_id: str
    title: str
    description: Optional[str]
    category: Optional[str]
    difficulty: str
    thumbnail_url: Optional[str]
    price: float
    status: str

class ModuleCreate(BaseModel):
    title: str
    order_index: int = 0

class LectureCreate(BaseModel):
    title: str
    description: Optional[str] = None
    video_url: Optional[str] = None
    transcript: Optional[str] = None
    duration_seconds: int = 0
    order_index: int = 0
    resource_urls: list[str] = []

class EnrollmentOut(BaseModel):
    id: str
    course_id: str
    progress_percent: float
