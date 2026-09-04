# Learnly — final testing checklist

## 1. Backend

Open PowerShell:

```powershell
cd D:\LEARNLY\backend
.\venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --reload --port 8000
```

If the virtual environment is not present or dependencies are incomplete:

```powershell
python -m pip install -r requirements.txt
```

## 2. Frontend

Open a second PowerShell:

```powershell
cd D:\LEARNLY\frontend
npm install
npm run dev
```

Open:

```text
http://127.0.0.1:5175
```

## 3. Demo accounts

Student:

```text
student@lmsai.com
Student@123
```

Instructor:

```text
instructor@lmsai.com
Instructor@123
```

Admin:

```text
admin@lmsai.com
Admin@123
```

## 4. Student acceptance test

1. Sign in as student.
2. Dashboard should show enrolled courses.
3. Courses should show approved courses.
4. Open Python Fundamentals.
5. Open a module and lecture.
6. Open My Learning.
7. Complete a lecture.
8. Confirm progress changes.
9. Open AI Tutor.

## 5. Instructor acceptance test

1. Sign out.
2. Sign in as instructor.
3. Instructor Dashboard must load without `401 Unauthorized`.
4. Instructor Courses must show existing courses.
5. Open Manage on Python Fundamentals.
6. Course Builder must load modules and lectures.
7. Add a module.
8. Add a lecture to that module.
9. Open Edit and save course information.
10. Create a new course.
11. Confirm the instructor-created course is `pending`.

## 6. API smoke tests

From `backend/`:

```powershell
pytest -q tests/test_smoke.py
```

## 7. Important auth fix

All frontend API calls now use one canonical token key:

```text
learnly_access_token
```

The app also temporarily mirrors it to `access_token` for compatibility with older components. On login, old token keys are cleared first, preventing a stale token from causing the previous `401 Unauthorized` problem.
