"""Learnly API smoke tests.

Run from backend/ after installing requirements:
    pytest -q tests/test_smoke.py

These tests deliberately use the seeded demo accounts so they can verify
that authentication, student courses, and instructor courses work together.
"""

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def login(email: str, password: str) -> str:
    response = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password},
    )
    assert response.status_code == 200, response.text
    data = response.json()
    assert data.get("access_token")
    return data["access_token"]


def auth_header(token: str):
    return {"Authorization": f"Bearer {token}"}


def test_student_auth_and_courses():
    token = login("student@lmsai.com", "Student@123")

    me = client.get(
        "/api/v1/auth/me",
        headers=auth_header(token),
    )
    assert me.status_code == 200, me.text
    assert "student" in me.json()["roles"]

    courses = client.get(
        "/api/v1/courses",
        headers=auth_header(token),
    )
    assert courses.status_code == 200, courses.text
    assert isinstance(courses.json(), list)
    assert any(c["title"] == "Python Fundamentals" for c in courses.json())


def test_student_dashboard_endpoints_are_authenticated():
    token = login("student@lmsai.com", "Student@123")
    headers = auth_header(token)

    for endpoint in [
        "/api/v1/dashboard/stats",
        "/api/v1/dashboard/streak",
        "/api/v1/enrollments/me",
    ]:
        response = client.get(endpoint, headers=headers)
        assert response.status_code == 200, f"{endpoint}: {response.text}"


def test_instructor_auth_and_courses():
    token = login("instructor@lmsai.com", "Instructor@123")
    headers = auth_header(token)

    me = client.get("/api/v1/auth/me", headers=headers)
    assert me.status_code == 200, me.text
    assert "instructor" in me.json()["roles"]

    dashboard = client.get(
        "/api/v1/instructor/dashboard",
        headers=headers,
    )
    assert dashboard.status_code == 200, dashboard.text

    courses = client.get(
        "/api/v1/instructor/courses",
        headers=headers,
    )
    assert courses.status_code == 200, courses.text
    assert isinstance(courses.json(), list)
    assert any(c["title"] == "Python Fundamentals" for c in courses.json())


def test_instructor_routes_reject_missing_token():
    response = client.get("/api/v1/instructor/dashboard")
    assert response.status_code == 401

    response = client.get("/api/v1/instructor/courses")
    assert response.status_code == 401
