LEARNLY --- AI-Powered Learning Management System

LEARNLY is a full-stack Learning Management System (LMS) that combines
structured online learning, quizzes, progress tracking, role-based
management, and an AI Tutor.

🌐 Live Application

Frontend: https://learnly-7q49.onrender.com

Backend: https://learnly-backend-1kxb.onrender.com

API Documentation:
https://learnly-backend-1kxb.onrender.com/docs

Health Check: https://learnly-backend-1kxb.onrender.com/health

✨ Features

Student

Registration and JWT login

Student dashboard

Course browsing and enrollment

Course learning with modules and lectures

Lecture completion and progress tracking

Quizzes, attempts, scores, and results

AI Tutor with Learn, Hint, Practice, Quiz, and Exam modes

AI-generated quizzes

Learning analytics

Profile management

Instructor

Instructor dashboard

Course creation

Course Builder

Module and lecture management

Course submission and status management

Admin

Admin Panel

User management

Role management

User suspension/activation

Course management

Course approval/rejection

Platform analytics

🏗️ Architecture

React + Vite Frontend
        │
        │ HTTPS / REST API
        ▼
FastAPI Backend
   │            │
   ▼            ▼
PostgreSQL    Groq AI

🛠️ Technology Stack

Frontend - React - Vite - JavaScript - React Router - CSS

Backend - Python - FastAPI - SQLAlchemy - Pydantic - JWT - Passlib /
bcrypt - Uvicorn

Database - PostgreSQL in production - SQLite for local development
where configured

AI - Groq API - Configurable Groq model

Deployment - GitHub - Render Static Site - Render Web Service -
Render PostgreSQL

📁 Project Structure

LEARNLY/
├── backend/
│   ├── app/
│   │   ├── models/
│   │   ├── routers/
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── dependencies.py
│   │   ├── main.py
│   │   └── security.py
│   ├── tests/
│   ├── requirements.txt
│   ├── seed.py
│   └── .python-version
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.*
├── backups/
├── .env.example
├── .gitignore
├── render.yaml
└── README.md

🔐 Security

JWT bearer authentication protects private API endpoints.

Role-based authorization protects instructor/admin operations.

Production secrets are stored in Render environment variables.

Groq API keys are kept server-side.

PostgreSQL credentials are kept server-side.

Frontend exposes only VITE_API_BASE_URL.

CORS is configured for the production frontend.

.env, database files, and database backups are excluded from Git.

Production frontend API configuration:

VITE_API_BASE_URL=https://learnly-backend-1kxb.onrender.com/api/v1

⚙️ Local Development

Backend

cd backend
python -m venv venv
.env\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

Backend:

http://127.0.0.1:8000

Swagger:

http://127.0.0.1:8000/docs

Frontend

cd frontend
npm install
npm run dev

For local development, configure:

VITE_API_BASE_URL=http://127.0.0.1:8000/api/v1

🗄️ Database

Production uses Render PostgreSQL. Local development can use SQLite:

DATABASE_URL=sqlite:///./learnly.db

The application uses SQLAlchemy ORM and creates the required tables
through the backend initialization/seed workflow.

🧪 Final Testing

Student

Register → Login → Dashboard
→ Browse Courses → Enroll
→ Course Learning → Complete Lectures
→ Quiz → Result
→ AI Tutor → Profile → Logout

Instructor

Login → Instructor Dashboard
→ Create Course → Course Builder
→ Add Modules/Lectures
→ Course Status → Logout

Admin

Login → Admin Panel
→ Users → Courses
→ Approve/Reject Courses
→ Analytics/Management → Logout

All major production workflows have been smoke-tested successfully.

🚀 Production Deployment

Frontend

Render Static Site:

Build: npm install && npm run build
Publish directory: dist

React Router rewrite:

Source: /*
Destination: /index.html
Action: Rewrite

Backend

Render Web Service:

Build: pip install -r requirements.txt
Start: uvicorn app.main:app --host 0.0.0.0 --port $PORT

Health endpoint:

GET /health

Expected response:

{
  "status": "ok",
  "service": "learnly-backend",
  "environment": "production"
}

💾 Database Backup

A production PostgreSQL backup was created with pg_dump.

Backups are stored locally in:

backups/

The directory is ignored by Git because database dumps contain sensitive
application data.

Example:

pg_dump "$env:DATABASE_URL" --format=custom --file ".ackups\learnly_production_backup.dump"

After using a temporary database URL:

Remove-Item Env:DATABASE_URL

🔑 Demo Accounts

Role         Email                  Password

Student      student@lmsai.com      Student@123
Instructor   instructor@lmsai.com   Instructor@123
Admin        admin@lmsai.com        Admin@123

Use unique credentials for any real production deployment.

📡 API Areas

/api/v1/auth
/api/v1/courses
/api/v1/ai-tutor
/api/v1/quiz
/api/v1/dashboard
/api/v1/instructor
/api/v1/admin

Complete API documentation:

https://learnly-backend-1kxb.onrender.com/docs

🔄 Deployment Workflow

VS Code
   ↓
Git
   ↓
GitHub main
   ├──→ Render Frontend
   └──→ Render Backend
              ├──→ PostgreSQL
              └──→ Groq AI

📌 Project Status

Completed and production-verified:

Authentication and registration

Courses and course learning

Enrollment

Modules and lectures

Learning progress

AI Tutor

Quiz system

Student dashboard

Student analytics

Profile management

Instructor dashboard

Course creation and Course Builder

Admin Panel

User and course management

Course approval workflow

PostgreSQL production database

Render deployment

Production CORS

SPA routing

Health monitoring

Database backup

GitHub deployment workflow

Intentionally excluded from the final scope:

Instructor Analytics

Student Management module

Advanced Course Builder expansion

Certificates

Notifications

AI Recommendations

🎯 Objective

The objective of LEARNLY is to provide a centralized AI-assisted
learning platform where students can learn through structured courses,
track progress, practice through quizzes, and interact with an AI Tutor
while instructors and administrators manage the platform.

📄 License

Copyright (c) 2026 LEARNLY Project

LEARNLY --- AI-Powered Learning Management System