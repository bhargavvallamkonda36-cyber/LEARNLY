"""Import MIT OCW 6.189 into the existing Learnly SQLAlchemy database.

Place this file in backend/ and run:
    python import_mit_course.py

It is intentionally idempotent: rerunning it will not create another copy of the course.
"""
from pathlib import Path
import json
import re
import uuid

from app.database import SessionLocal
from app.models.user import User
from app.models.course import Course, Module, Lecture

COURSE_TITLE = "A Gentle Introduction to Programming Using Python"
COURSE_URL = "https://ocw.mit.edu/courses/6-189-a-gentle-introduction-to-programming-using-python-january-iap-2008/"
LICENSE = "CC BY-NC-SA 4.0"
SOURCE = "MIT OpenCourseWare"
BASE = Path(__file__).resolve().parent
RESOURCE_DIR = BASE / "mit_course_resources"

SESSIONS = [
    (1, "Variables and types"),
    (2, "Functions and basic recursion"),
    (3, "Control flow: branching and repetition"),
    (4, "Introduction to objects: strings and lists"),
    (5, "Project 1: Structuring larger programs"),
    (6, "Python modules and debugging programs"),
    (7, "Introduction to data structures: dictionaries"),
    (8, "Functions as a type, anonymous functions and list comprehensions"),
    (9, "Project 2: Working in a team"),
    (10, "Quiz and wrap-up"),
]

RESOURCE_FILES = {
    "notes1": "120773df723c51370dcc2f94aaf55435_notes1.pdf",
    "handout1": "87f5c450eb6ae3779b2b0198fedafbea_handout1.pdf",
    "handout2": "f14cc25f40fd15ab9bda49280569f69c_handout2.pdf",
    "handout3": "351789772d3cd3ecabb53b4c56f81d64_handout3.pdf",
    "handout4": "4f9355b3f8f254d72109cf820629d6cc_handout4.pdf",
    "handout5": "4e4b3fa444d8220111333e74df4bca86_handout5.pdf",
    "notes6": "a6cad15cd20526492757bc096a4a9d7f_notes6.pdf",
    "notes7": "7fef0cb6f5a93e432e4f644cfa3de760_notes7.pdf",
    "notes8": "cba573ff35344d37c5c0d65e48281575_notes8.pdf",
    "notes9": "2d195da2e0cf3b7e42d1e11e4865c5cb_notes9.pdf",
}


def roles_for(user):
    return {getattr(r, "name", "") for r in getattr(user, "roles", [])}


def get_instructor(db):
    users = db.query(User).all()
    for user in users:
        roles = roles_for(user)
        if "admin" in roles or "instructor" in roles:
            return user
    raise RuntimeError(
        "No instructor/admin user exists. Create an instructor/admin account first, "
        "then run this importer again."
    )


def add_lecture(db, module, title, description, resource_name=None):
    # Avoid duplicate lectures when the importer is run repeatedly.
    existing = (
        db.query(Lecture)
        .filter(Lecture.module_id == module.id, Lecture.title == title)
        .first()
    )
    if existing:
        return existing

    resource_urls = []
    if resource_name:
        resource_urls.append(
            f"{COURSE_URL}#{resource_name}"
        )

    lecture = Lecture(
        module_id=module.id,
        title=title,
        description=description,
        video_url=None,
        transcript=None,
        duration_seconds=0,
        order_index=0,
        resource_urls=resource_urls,
    )
    db.add(lecture)
    db.flush()
    return lecture


def main():
    db = SessionLocal()
    try:
        instructor = get_instructor(db)

        course = (
            db.query(Course)
            .filter(Course.title == COURSE_TITLE)
            .first()
        )

        if not course:
            course = Course(
                instructor_id=instructor.id,
                title=COURSE_TITLE,
                description=(
                    "MIT OpenCourseWare 6.189 (January IAP 2008). "
                    "A gentle introduction to programming using Python for students "
                    "with little or no prior programming experience.\n\n"
                    f"Source: {SOURCE}\nSource URL: {COURSE_URL}\nLicense: {LICENSE}"
                ),
                category="Programming",
                difficulty="Beginner",
                thumbnail_url=None,
                price=0,
                status="approved",
            )
            db.add(course)
            db.flush()
        else:
            # Ensure imported course remains visible.
            course.status = "approved"

        # Create 10 syllabus modules.
        for number, title in SESSIONS:
            module_title = f"Session {number}: {title}"
            module = (
                db.query(Module)
                .filter(Module.course_id == course.id, Module.title == module_title)
                .first()
            )
            if not module:
                module = Module(
                    course_id=course.id,
                    title=module_title,
                    order_index=number,
                )
                db.add(module)
                db.flush()

        # Add the actual downloadable lecture-note resources supplied by OCW.
        resource_to_session = [
            (1, "Session 1 notes", "notes1"),
            (1, "Handout 1 — loops", "handout1"),
            (3, "Handout 2 — functions, lists, loops and tuples", "handout2"),
            (4, "Handout 3 — objects", "handout3"),
            (7, "Handout 4 — dictionaries and Web indexer", "handout4"),
            (7, "Handout 5 — compound dictionaries", "handout5"),
            (6, "Session 6 homework / notes", "notes6"),
            (7, "Optional Session 7 homework / lists practice", "notes7"),
            (8, "Session 8 notes — dictionaries", "notes8"),
            (9, "Session 9 worksheet — errors and programming practices", "notes9"),
        ]

        for session_no, title, key in resource_to_session:
            module_title = f"Session {session_no}: {dict(SESSIONS)[session_no]}"
            module = (
                db.query(Module)
                .filter(Module.course_id == course.id, Module.title == module_title)
                .first()
            )
            filename = RESOURCE_FILES[key]
            description = (
                f"Open educational resource from {SOURCE}. "
                f"Original course: {COURSE_URL}. License: {LICENSE}. "
                f"Downloaded resource file: {filename}."
            )
            add_lecture(db, module, title, description, key)

        # Add a course-level orientation item to session 1.
        module = (
            db.query(Module)
            .filter(Module.course_id == course.id, Module.order_index == 1)
            .first()
        )
        add_lecture(
            db,
            module,
            "Course orientation and syllabus",
            f"MIT OCW syllabus and course overview. Source: {COURSE_URL}. License: {LICENSE}.",
            "syllabus",
        )

        db.commit()
        print("\nSUCCESS: MIT 6.189 imported into Learnly.")
        print(f"Course ID: {course.id}")
        print(f"Course: {course.title}")
        print("Modules: 10")
        print("Imported resource lectures: 11")
        print("Status: approved")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
