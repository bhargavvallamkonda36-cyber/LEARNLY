from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os


# ============================================================
# DATABASE
# ============================================================

from app.database import Base, engine


# ============================================================
# MODELS
# ============================================================

from app.models.user import User, Role

from app.models.course import (
    Course,
    Module,
    Lecture,
    Enrollment,
    LectureProgress,
)

from app.models.quiz import (
    Quiz,
    QuizQuestion,
    QuizAttempt,
)


# ============================================================
# MODEL REGISTRATION
# ============================================================

from app.models import quiz as quiz_models


# ============================================================
# ROUTERS
# ============================================================

from app.routers import auth
from app.routers import courses
from app.routers import ai_tutor
from app.routers import quiz as quiz_router
from app.routers import dashboard
from app.routers import instructor
from app.routers import admin


# ============================================================
# DATABASE TABLES
# ============================================================

Base.metadata.create_all(
    bind=engine
)


# ============================================================
# APPLICATION
# ============================================================

app = FastAPI(
    title="Learnly LMS API",
    description="Learnly Learning Management System API",
    version="2.0.0",
)


# ============================================================
# CORS
# ============================================================

# Read allowed frontend origins from environment.
#
# Render production:
# CORS_ORIGINS should contain the deployed frontend URL.
#
# Local development:
# If CORS_ORIGINS is not configured, the local Vite
# development URLs below are used.

cors_origins = os.getenv(
    "CORS_ORIGINS",
    (
        "http://127.0.0.1:5175,"
        "http://localhost:5175,"
        "http://127.0.0.1:5173,"
        "http://localhost:5173,"
        "http://127.0.0.1:5174,"
        "http://localhost:5174"
    ),
)

allowed_origins = [
    origin.strip()
    for origin in cors_origins.split(",")
    if origin.strip()
]


app.add_middleware(
    CORSMiddleware,

    allow_origins=allowed_origins,

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"],
)


# ============================================================
# AUTH
# ============================================================

# auth.router already contains its own API prefix.
app.include_router(
    auth.router,
)


# ============================================================
# COURSES
# ============================================================

# courses.router already contains:
# prefix="/api/v1"
app.include_router(
    courses.router,
)


# ============================================================
# AI TUTOR
# ============================================================

app.include_router(
    ai_tutor.router,
    prefix="/api/v1",
)


# ============================================================
# QUIZ
# ============================================================

app.include_router(
    quiz_router.router,
)


# ============================================================
# STUDENT DASHBOARD
# ============================================================

app.include_router(
    dashboard.router,
    prefix="/api/v1",
)


# ============================================================
# INSTRUCTOR
# ============================================================

# instructor.router already contains its own prefix.
app.include_router(
    instructor.router,
)


# ============================================================
# ADMIN
# ============================================================

# admin.router already contains:
#
# prefix="/api/v1/admin"
#
# Therefore DO NOT add another prefix here.
#
# Correct:
#     app.include_router(admin.router)
#
# NOT:
#     app.include_router(admin.router, prefix="/api/v1")

app.include_router(
    admin.router,
)


# ============================================================
# ROOT
# ============================================================

@app.get("/")
def root():
    return {
        "message": "Learnly LMS Backend Running 🚀",
        "version": "2.0.0",
        "status": "online",
    }


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "learnly-backend",
        "environment": os.getenv(
            "ENVIRONMENT",
            "development",
        ),
    }