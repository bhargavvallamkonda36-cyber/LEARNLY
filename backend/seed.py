import sys
from pathlib import Path

# =========================================================
# PROJECT PATH
# =========================================================

sys.path.append(
    str(Path(__file__).resolve().parent)
)

# =========================================================
# IMPORTS
# =========================================================

from app.database import (
    Base,
    engine,
    SessionLocal,
)

from app.models.user import (
    User,
    Role,
)

from app.models.course import (
    Course,
    Module,
    Lecture,
)

from app.security import hash_password


# =========================================================
# CREATE DATABASE TABLES
# =========================================================

Base.metadata.create_all(bind=engine)


# =========================================================
# DATABASE SESSION
# =========================================================

db = SessionLocal()


# =========================================================
# YOUTUBE PLAYLIST
# =========================================================

YOUTUBE_PLAYLIST_URL = (
    "https://www.youtube.com/"
    "playlist?list="
    "PLZPZq0r_RZOOkUQbat8LyQii36cJf2SWT"
)


# =========================================================
# PYTHON COURSE MODULES
# =========================================================
#
# All videos are from the same Bro Code Python playlist.
#
# 10 modules:
#
# 1. Introduction to Python
# 2. Variables and Data Types
# 3. Operators and Conditional Statements
# 4. Loops
# 5. Collections
# 6. Functions
# 7. Modules, Scope and Comprehensions
# 8. Object-Oriented Programming
# 9. Exceptions and File Handling
# 10. Advanced Python
#
# =========================================================

PYTHON_MODULES = [

    {
        "order": 1,
        "title": "Module 1 — Introduction to Python",
        "description": (
            "Learn what Python is, how to start programming "
            "with Python, and write your first Python programs."
        ),
        "lecture_title": "Introduction to Python",
        "lecture_description": (
            "Introduction to Python programming, "
            "Python interpreter, setup and basic syntax."
        ),
        "video_url": (
            "https://www.youtube.com/watch?v=Sg4GMVMdOPo"
        ),
        "duration_seconds": 313,
        "transcript": (
            "Introduction to Python programming. "
            "This lesson introduces Python, the Python "
            "interpreter, basic setup and the first Python program."
        ),
    },

    {
        "order": 2,
        "title": "Module 2 — Variables and Data Types",
        "description": (
            "Learn variables, values, strings, numbers, "
            "type casting and user input."
        ),
        "lecture_title": "Variables and Data Types",
        "lecture_description": (
            "Learn Python variables, values and basic data types."
        ),
        "video_url": (
            "https://www.youtube.com/watch?v=7IoQ5BGkTJo"
        ),
        "duration_seconds": 620,
        "transcript": (
            "Learn how variables work in Python and how values "
            "are stored and used. This module introduces Python "
            "variables and basic data concepts."
        ),
    },

    {
        "order": 3,
        "title": "Module 3 — Operators and Conditional Statements",
        "description": (
            "Learn arithmetic operators, comparison operators, "
            "logical operators, if, elif, else and conditional expressions."
        ),
        "lecture_title": "Operators and Conditional Statements",
        "lecture_description": (
            "Learn Python operators and decision-making "
            "using if, elif and else."
        ),
        "video_url": (
            "https://www.youtube.com/watch?v=FvMPfrgGeKs"
        ),
        "duration_seconds": 727,
        "transcript": (
            "Learn conditional statements in Python including "
            "if, elif and else. Conditional logic allows programs "
            "to make decisions based on conditions."
        ),
    },

    {
        "order": 4,
        "title": "Module 4 — Loops",
        "description": (
            "Learn while loops, for loops, nested loops, "
            "iteration and practical loop-based programs."
        ),
        "lecture_title": "Loops in Python",
        "lecture_description": (
            "Learn while loops, for loops and nested loops."
        ),
        "video_url": (
            "https://www.youtube.com/watch?v=KWgYha0clzw"
        ),
        "duration_seconds": 347,
        "transcript": (
            "Loops allow Python programs to repeat instructions. "
            "This lesson introduces for loops and iteration."
        ),
    },

    {
        "order": 5,
        "title": "Module 5 — Collections",
        "description": (
            "Learn lists, tuples, sets, dictionaries, "
            "2D collections and collection operations."
        ),
        "lecture_title": "Python Collections",
        "lecture_description": (
            "Learn lists, sets, tuples and other Python collections."
        ),
        "video_url": (
            "https://www.youtube.com/watch?v=gOMW_n2-2Mw"
        ),
        "duration_seconds": 784,
        "transcript": (
            "Python provides several collection types including "
            "lists, sets and tuples. These data structures allow "
            "programs to store and organize multiple values."
        ),
    },

    {
        "order": 6,
        "title": "Module 6 — Functions",
        "description": (
            "Learn functions, parameters, return values, "
            "default arguments, keyword arguments, *args and **kwargs."
        ),
        "lecture_title": "Functions in Python",
        "lecture_description": (
            "Learn how to define and use reusable Python functions."
        ),
        "video_url": (
            "https://www.youtube.com/watch?v=89cGQjB5R4M"
        ),
        "duration_seconds": 545,
        "transcript": (
            "Functions allow developers to organize reusable "
            "blocks of code. This lesson introduces function "
            "definitions, parameters and function calls."
        ),
    },

    {
        "order": 7,
        "title": "Module 7 — Modules, Scope and Comprehensions",
        "description": (
            "Learn Python modules, variable scope, "
            "iterables, membership operators and list comprehensions."
        ),
        "lecture_title": "Modules and List Comprehensions",
        "lecture_description": (
            "Learn Python modules, scope and list comprehensions."
        ),
        "video_url": (
            "https://www.youtube.com/watch?v=YlY2g2xrl6Q"
        ),
        "duration_seconds": 622,
        "transcript": (
            "Python modules help organize code into reusable files. "
            "Variable scope determines where variables can be accessed. "
            "List comprehensions provide a concise way to create lists."
        ),
    },

    {
        "order": 8,
        "title": "Module 8 — Object-Oriented Programming",
        "description": (
            "Learn classes, objects, class variables, inheritance, "
            "polymorphism and object-oriented programming concepts."
        ),
        "lecture_title": "Object-Oriented Programming in Python",
        "lecture_description": (
            "Introduction to Python object-oriented programming "
            "using classes and objects."
        ),
        "video_url": (
            "https://www.youtube.com/watch?v=1XE-_s4ZBT8"
        ),
        "duration_seconds": 931,
        "transcript": (
            "Object-oriented programming organizes programs using "
            "classes and objects. This lesson introduces Python "
            "classes, objects and object-oriented programming."
        ),
    },

    {
        "order": 9,
        "title": "Module 9 — Exceptions and File Handling",
        "description": (
            "Learn exception handling, detecting files, "
            "reading files and writing files."
        ),
        "lecture_title": "Exception Handling and Files",
        "lecture_description": (
            "Learn how to handle errors and work with files "
            "using Python."
        ),
        "video_url": (
            "https://www.youtube.com/watch?v=V_NXT2-QIlE"
        ),
        "duration_seconds": 359,
        "transcript": (
            "Exception handling allows Python programs to handle "
            "runtime errors safely. File handling allows programs "
            "to read from and write to files."
        ),
    },

    {
        "order": 10,
        "title": "Module 10 — Advanced Python",
        "description": (
            "Learn iterators, generators, multithreading, "
            "API requests and practical advanced Python concepts."
        ),
        "lecture_title": "Advanced Python Concepts",
        "lecture_description": (
            "Introduction to advanced Python concepts including "
            "iterators, generators, threading and APIs."
        ),
        "video_url": (
            "https://www.youtube.com/watch?v=Gsfsq2epdr8"
        ),
        "duration_seconds": 524,
        "transcript": (
            "Advanced Python concepts include iterators and generators. "
            "These features allow Python programs to process data "
            "efficiently and build reusable iteration logic."
        ),
    },

]


# =========================================================
# HELPER — CREATE OR UPDATE USER
# =========================================================

def make_user(
    email,
    name,
    password,
    role_name,
    roles,
):

    user = (
        db.query(User)
        .filter(User.email == email)
        .first()
    )

    # -----------------------------------------------------
    # CREATE USER
    # -----------------------------------------------------

    if not user:

        user = User(
            full_name=name,
            email=email,
            password_hash=hash_password(password),
            is_active=True,
        )

        db.add(user)
        db.flush()

    # -----------------------------------------------------
    # UPDATE USER
    # -----------------------------------------------------

    else:

        user.full_name = name

        user.password_hash = hash_password(
            password
        )

        user.is_active = True

    # -----------------------------------------------------
    # ROLE
    # -----------------------------------------------------

    role = roles[role_name]

    if role not in user.roles:

        user.roles.append(role)

    db.flush()

    return user


# =========================================================
# MAIN SEED
# =========================================================

try:

    # =====================================================
    # CREATE ROLES
    # =====================================================

    roles = {}

    for role_name in [
        "student",
        "instructor",
        "admin",
    ]:

        role = (
            db.query(Role)
            .filter(
                Role.name == role_name
            )
            .first()
        )

        if not role:

            role = Role(
                name=role_name
            )

            db.add(role)

            db.flush()

        roles[role_name] = role


    # =====================================================
    # DEMO USERS
    # =====================================================

    student = make_user(
        "student@lmsai.com",
        "Demo Student",
        "Student@123",
        "student",
        roles,
    )

    instructor = make_user(
        "instructor@lmsai.com",
        "Demo Instructor",
        "Instructor@123",
        "instructor",
        roles,
    )

    admin = make_user(
        "admin@lmsai.com",
        "Demo Admin",
        "Admin@123",
        "admin",
        roles,
    )


    # =====================================================
    # FIND / CREATE PYTHON COURSE
    # =====================================================

    course = (
        db.query(Course)
        .filter(
            Course.title ==
            "Python Fundamentals"
        )
        .first()
    )


    if not course:

        course = Course(
            instructor_id=instructor.id,

            title="Python Fundamentals",

            description=(
                "Learn Python programming from "
                "beginner fundamentals through "
                "advanced concepts with practical "
                "examples and an AI Tutor."
            ),

            category="Programming",

            difficulty="beginner",

            thumbnail_url="",

            price=0,

            status="approved",
        )

        db.add(course)

        db.flush()

    else:

        # Update existing course

        course.instructor_id = instructor.id

        course.description = (
            "Learn Python programming from "
            "beginner fundamentals through "
            "advanced concepts with practical "
            "examples and an AI Tutor."
        )

        course.category = "Programming"

        course.difficulty = "beginner"

        course.status = "approved"


    # =====================================================
    # CREATE / UPDATE 10 MODULES
    # =====================================================

    for module_data in PYTHON_MODULES:

        module = (
            db.query(Module)
            .filter(
                Module.course_id == course.id,
                Module.order_index ==
                module_data["order"],
            )
            .first()
        )


        # -------------------------------------------------
        # CREATE MODULE
        # -------------------------------------------------

        if not module:

            module = Module(
                course_id=course.id,

                title=module_data["title"],

                order_index=module_data["order"],
            )

            db.add(module)

            db.flush()


        # -------------------------------------------------
        # UPDATE MODULE
        # -------------------------------------------------

        else:

            module.title = module_data["title"]


        # =================================================
        # FIND LECTURE
        # =================================================

        lecture = (
            db.query(Lecture)
            .filter(
                Lecture.module_id ==
                module.id,
                Lecture.order_index == 1,
            )
            .first()
        )


        # -------------------------------------------------
        # CREATE LECTURE
        # -------------------------------------------------

        if not lecture:

            lecture = Lecture(
                module_id=module.id,

                title=module_data[
                    "lecture_title"
                ],

                description=module_data[
                    "lecture_description"
                ],

                video_url=module_data[
                    "video_url"
                ],

                transcript=module_data[
                    "transcript"
                ],

                duration_seconds=module_data[
                    "duration_seconds"
                ],

                order_index=1,

                resource_urls=[
                    YOUTUBE_PLAYLIST_URL
                ],
            )

            db.add(lecture)


        # -------------------------------------------------
        # UPDATE EXISTING LECTURE
        # -------------------------------------------------

        else:

            lecture.title = module_data[
                "lecture_title"
            ]

            lecture.description = (
                module_data[
                    "lecture_description"
                ]
            )

            lecture.video_url = (
                module_data[
                    "video_url"
                ]
            )

            lecture.transcript = (
                module_data[
                    "transcript"
                ]
            )

            lecture.duration_seconds = (
                module_data[
                    "duration_seconds"
                ]
            )

            lecture.resource_urls = [
                YOUTUBE_PLAYLIST_URL
            ]


    # =====================================================
    # SAVE
    # =====================================================

    db.commit()


    # =====================================================
    # SUCCESS MESSAGE
    # =====================================================

    print()
    print("=" * 70)
    print("LEARNLY PYTHON COURSE SEED COMPLETE")
    print("=" * 70)
    print()

    print("Course:")
    print("Python Fundamentals")
    print()

    print("Modules created / updated:")
    print("1. Introduction to Python")
    print("2. Variables and Data Types")
    print("3. Operators and Conditional Statements")
    print("4. Loops")
    print("5. Collections")
    print("6. Functions")
    print("7. Modules, Scope and Comprehensions")
    print("8. Object-Oriented Programming")
    print("9. Exceptions and File Handling")
    print("10. Advanced Python")
    print()

    print("YouTube playlist:")
    print(YOUTUBE_PLAYLIST_URL)
    print()

    print("Demo Student:")
    print("Email    : student@lmsai.com")
    print("Password : Student@123")
    print()

    print("=" * 70)


except Exception as error:

    # =====================================================
    # ROLLBACK
    # =====================================================

    db.rollback()

    print()
    print("=" * 70)
    print("PYTHON COURSE SEED FAILED")
    print("=" * 70)
    print()

    print(repr(error))

    print()

    raise


finally:

    # =====================================================
    # CLOSE DATABASE
    # =====================================================

    db.close()
    