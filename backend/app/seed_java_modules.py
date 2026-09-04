import sys
from pathlib import Path

# ============================================================
# PROJECT PATH
# ============================================================

sys.path.append(
    str(Path(__file__).resolve().parent)
)

# ============================================================
# IMPORTS
# ============================================================

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


# ============================================================
# CREATE TABLES
# ============================================================

Base.metadata.create_all(bind=engine)


# ============================================================
# DATABASE
# ============================================================

db = SessionLocal()


# ============================================================
# JAVA COURSE DATA
# ============================================================

JAVA_MODULES = [

    {
        "title": "Module 1 — Introduction to Java",
        "description": (
            "Learn Java fundamentals, variables, user input, "
            "expressions and basic programming concepts."
        ),
        "video_url": "https://www.youtube.com/watch?v=xTtL8E4LzTQ",
    },

    {
        "title": "Module 2 — Methods & Conditionals",
        "description": (
            "Learn if statements, switch statements, logical "
            "operators and Java methods."
        ),
        "video_url": "https://www.youtube.com/watch?v=xTtL8E4LzTQ",
    },

    {
        "title": "Module 3 — Variables, Types & Operators",
        "description": (
            "Learn Java variables, primitive data types, "
            "strings, expressions and operators."
        ),
        "video_url": "https://www.youtube.com/watch?v=xTtL8E4LzTQ",
    },

    {
        "title": "Module 4 — Loops & Arrays",
        "description": (
            "Learn while loops, for loops, nested loops, "
            "arrays and two-dimensional arrays."
        ),
        "video_url": "https://www.youtube.com/watch?v=xTtL8E4LzTQ",
    },

    {
        "title": "Module 5 — Classes & Objects",
        "description": (
            "Learn object-oriented programming, classes, "
            "objects, constructors and inheritance."
        ),
        "video_url": "https://www.youtube.com/watch?v=xTtL8E4LzTQ",
    },

    {
        "title": "Module 6 — Encapsulation & Collections",
        "description": (
            "Learn encapsulation, getters, setters, "
            "ArrayLists and HashMaps."
        ),
        "video_url": "https://www.youtube.com/watch?v=xTtL8E4LzTQ",
    },

    {
        "title": "Module 7 — Exception & File Handling",
        "description": (
            "Learn exception handling and reading and "
            "writing files in Java."
        ),
        "video_url": "https://www.youtube.com/watch?v=xTtL8E4LzTQ",
    },

    {
        "title": "Module 8 — Debugging / Testing",
        "description": (
            "Practice Java programming and learn how to "
            "identify and fix programming errors."
        ),
        "video_url": "https://www.youtube.com/watch?v=xTtL8E4LzTQ",
    },

    {
        "title": "Module 9 — Projects",
        "description": (
            "Build practical Java projects and strengthen "
            "programming skills."
        ),
        "video_url": "https://www.youtube.com/watch?v=xTtL8E4LzTQ",
    },

    {
        "title": "Module 10 — Practice / Advanced Topics",
        "description": (
            "Practice advanced Java concepts including "
            "generics, enums, threading and multithreading."
        ),
        "video_url": "https://www.youtube.com/watch?v=xTtL8E4LzTQ",
    },

]


# ============================================================
# LECTURE TITLES
# ============================================================

LECTURE_TITLES = [
    "Introduction to Java",
    "Methods & Conditionals",
    "Variables, Types & Operators",
    "Loops & Arrays",
    "Classes & Objects",
    "Encapsulation & Collections",
    "Exception & File Handling",
    "Debugging & Testing",
    "Java Projects",
    "Practice & Advanced Java",
]


# ============================================================
# CREATE / FIND ROLE
# ============================================================

def get_or_create_role(name):

    role = (
        db.query(Role)
        .filter(Role.name == name)
        .first()
    )

    if not role:

        role = Role(
            name=name
        )

        db.add(role)
        db.flush()

    return role


# ============================================================
# CREATE / UPDATE USER
# ============================================================

def make_user(
    email,
    name,
    password,
    role_name,
):

    user = (
        db.query(User)
        .filter(User.email == email)
        .first()
    )

    if not user:

        user = User(
            full_name=name,
            email=email,
            password_hash=hash_password(password),
            is_active=True,
        )

        db.add(user)
        db.flush()

    else:

        user.full_name = name

        user.password_hash = hash_password(
            password
        )

        user.is_active = True

    role = get_or_create_role(role_name)

    if role not in user.roles:
        user.roles.append(role)

    db.flush()

    return user


# ============================================================
# MAIN
# ============================================================

try:

    print()
    print("=" * 70)
    print("LEARNLY — JAVA COURSE SEED")
    print("=" * 70)
    print()


    # ========================================================
    # DEMO INSTRUCTOR
    # ========================================================

    instructor = make_user(
        "instructor@lmsai.com",
        "Demo Instructor",
        "Instructor@123",
        "instructor",
    )


    # ========================================================
    # FIND / CREATE JAVA COURSE
    # ========================================================

    course = (
        db.query(Course)
        .filter(
            Course.title == "Java Fundamentals"
        )
        .first()
    )


    if not course:

        course = Course(

            instructor_id=instructor.id,

            title="Java Fundamentals",

            description=(
                "Learn Java programming from the "
                "fundamentals through object-oriented "
                "programming, collections, exceptions, "
                "multithreading, practical assignments "
                "and projects."
            ),

            category="Programming",

            difficulty="beginner",

            thumbnail_url="",

            price=0,

            status="approved",
        )

        db.add(course)
        db.flush()

        print("Created Java Fundamentals course.")

    else:

        print("Java Fundamentals course already exists.")


    # ========================================================
    # CREATE / UPDATE 10 MODULES
    # ========================================================

    for index, module_data in enumerate(
        JAVA_MODULES,
        start=1,
    ):

        module = (
            db.query(Module)
            .filter(
                Module.course_id == course.id,
                Module.order_index == index,
            )
            .first()
        )


        # ----------------------------------------------------
        # CREATE MODULE
        # ----------------------------------------------------

        if not module:

            module = Module(

                course_id=course.id,

                title=module_data["title"],

                order_index=index,
            )

            db.add(module)
            db.flush()

            print(
                f"Created Module {index}"
            )

        else:

            module.title = module_data["title"]

            print(
                f"Updated Module {index}"
            )


        # ====================================================
        # FIND / CREATE LECTURE
        # ====================================================

        lecture = (
            db.query(Lecture)
            .filter(
                Lecture.module_id == module.id,
                Lecture.order_index == 1,
            )
            .first()
        )


        if not lecture:

            lecture = Lecture(

                module_id=module.id,

                title=LECTURE_TITLES[index - 1],

                description=module_data[
                    "description"
                ],

                video_url=module_data[
                    "video_url"
                ],

                transcript=(
                    "This lecture is part of the "
                    "Learnly Java Fundamentals course. "
                    "Students should watch the embedded "
                    "YouTube lesson and practice the "
                    "concepts covered in the module."
                ),

                duration_seconds=0,

                order_index=1,

                resource_urls=[],
            )

            db.add(lecture)

            print(
                f"  Added YouTube lecture to Module {index}"
            )

        else:

            lecture.title = (
                LECTURE_TITLES[index - 1]
            )

            lecture.description = (
                module_data["description"]
            )

            lecture.video_url = (
                module_data["video_url"]
            )

            print(
                f"  Updated YouTube lecture for Module {index}"
            )


    # ========================================================
    # SAVE
    # ========================================================

    db.commit()


    # ========================================================
    # VERIFY
    # ========================================================

    modules = (
        db.query(Module)
        .filter(
            Module.course_id == course.id
        )
        .order_by(
            Module.order_index
        )
        .all()
    )


    print()
    print("=" * 70)
    print("FINAL JAVA COURSE STRUCTURE")
    print("=" * 70)
    print()


    for module in modules:

        lecture_count = (
            db.query(Lecture)
            .filter(
                Lecture.module_id == module.id
            )
            .count()
        )

        print(
            f"{module.order_index}. "
            f"{module.title} "
            f"— {lecture_count} lecture(s)"
        )


    print()
    print(
        f"TOTAL MODULES: {len(modules)}"
    )

    print()

    print(
        "JAVA COURSE SUCCESSFULLY UPDATED."
    )

    print(
        "YouTube learning video connected."
    )

    print()

    print("=" * 70)


except Exception as error:

    db.rollback()

    print()
    print("=" * 70)
    print("JAVA COURSE SEED FAILED")
    print("=" * 70)
    print()

    print(error)

    print()

    raise


finally:

    db.close()
    