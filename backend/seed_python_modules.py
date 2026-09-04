import uuid

from app.database import SessionLocal

# IMPORTANT:
# Load User BEFORE Course so SQLAlchemy can resolve
# relationships such as relationship("User").
from app.models.user import User

from app.models.course import (
    Course,
    Module,
    Lecture,
)


# ============================================================
# CONFIGURATION
# ============================================================

COURSE_ID = "79330a05-d382-42e9-bdb7-8d4f81924b9d"

# Bro Code Python Playlist
PYTHON_PLAYLIST_URL = (
    "https://www.youtube.com/playlist"
    "?list=PLZPZq0r_RZOOkUQbat8LyQii36cJf2SWT"
)


# ============================================================
# ALL 10 PYTHON FUNDAMENTALS MODULES
# ============================================================

MODULES = [

    # ========================================================
    # MODULE 1
    # ========================================================

    {
        "order": 1,

        "title": "Module 1 — Introduction to Python",

        "lecture": "Introduction to Python",

        "description": (
            "Learn the basics of Python programming, "
            "Python syntax, the Python environment and "
            "your first Python program."
        ),

        "video_url": (
            "https://www.youtube.com/watch?v=Sg4GMVMdOPo"
        ),

        "duration_seconds": 313,
    },


    # ========================================================
    # MODULE 2
    # ========================================================

    {
        "order": 2,

        "title": "Module 2 — Variables and Data Types",

        "lecture": "Variables and Data Types",

        "description": (
            "Learn Python variables, strings, integers, "
            "floats, booleans and basic data types."
        ),

        "video_url": (
            "https://www.youtube.com/watch?v=7IoQ5BGkTJo"
        ),

        "duration_seconds": 620,
    },


    # ========================================================
    # MODULE 3
    # ========================================================

    {
        "order": 3,

        "title": "Module 3 — Control Flow",

        "lecture": "Control Flow",

        "description": (
            "Learn conditional statements, logical "
            "operators and decision making in Python."
        ),

        "video_url": (
            "https://www.youtube.com/watch?v=FvMPfrgGeKs"
        ),

        "duration_seconds": 727,
    },


    # ========================================================
    # MODULE 4
    # ========================================================

    {
        "order": 4,

        "title": "Module 4 — Functions",

        "lecture": "Functions",

        "description": (
            "Learn how to define and call functions, "
            "use parameters, arguments and return values."
        ),

        "video_url": (
            "https://www.youtube.com/watch?v=89cGQjB5R4M"
        ),

        "duration_seconds": 545,
    },


    # ========================================================
    # MODULE 5
    # ========================================================

    {
        "order": 5,

        "title": "Module 5 — Data Structures",

        "lecture": "Data Structures",

        "description": (
            "Learn Python lists, sets, tuples and "
            "the fundamentals of working with collections."
        ),

        "video_url": (
            "https://www.youtube.com/watch?v=gOMW_n2-2Mw"
        ),

        "duration_seconds": 784,
    },


    # ========================================================
    # MODULE 6
    # ========================================================

    {
        "order": 6,

        "title": "Module 6 — File Handling",

        "lecture": "File Handling",

        "description": (
            "Learn how to detect, read and write files "
            "using Python."
        ),

        "video_url": (
            "https://www.youtube.com/watch?v=GWBWQnWBI"
        ),

        "duration_seconds": 355,
    },


    # ========================================================
    # MODULE 7
    # ========================================================

    {
        "order": 7,

        "title": "Module 7 — Object-Oriented Programming",

        "lecture": "Object-Oriented Programming",

        "description": (
            "Learn classes, objects, attributes, methods "
            "and the fundamentals of object-oriented "
            "programming in Python."
        ),

        "video_url": (
            "https://www.youtube.com/watch?v=1XE-_s4ZBT8"
        ),

        "duration_seconds": 931,
    },


    # ========================================================
    # MODULE 8
    # ========================================================

    {
        "order": 8,

        "title": "Module 8 — Debugging / Testing",

        "lecture": "Debugging and Testing",

        "description": (
            "Learn how Python handles errors and exceptions "
            "and develop better debugging and error-handling "
            "practices."
        ),

        "video_url": (
            "https://www.youtube.com/watch?v=V_NXT2-QIlE"
        ),

        "duration_seconds": 359,
    },


    # ========================================================
    # MODULE 9
    # ========================================================

    {
        "order": 9,

        "title": "Module 9 — Projects",

        "lecture": "Python Projects",

        "description": (
            "Apply Python programming concepts by building "
            "a practical beginner project."
        ),

        "video_url": (
            "https://www.youtube.com/watch?v=ag8NtD1e0Kc"
        ),

        "duration_seconds": 1273,
    },


    # ========================================================
    # MODULE 10
    # ========================================================

    {
        "order": 10,

        "title": "Module 10 — Practice / Advanced Topics",

        "lecture": "Practice and Advanced Topics",

        "description": (
            "Practice Python programming and explore "
            "advanced concepts such as recursion."
        ),

        "video_url": (
            "https://www.youtube.com/watch?v=ivl5-snqul8"
        ),

        "duration_seconds": 342,
    },
]


# ============================================================
# MAIN
# ============================================================

def main():

    db = SessionLocal()

    try:

        # ====================================================
        # FIND COURSE
        # ====================================================

        course = (
            db.query(Course)
            .filter(Course.id == COURSE_ID)
            .first()
        )

        if not course:

            print()
            print("=" * 70)
            print("ERROR: COURSE NOT FOUND")
            print("=" * 70)
            print()

            print(f"Course ID: {COURSE_ID}")

            print()

            return


        # ====================================================
        # HEADER
        # ====================================================

        print()
        print("=" * 70)
        print("LEARNLY")
        print("PYTHON FUNDAMENTALS COURSE UPDATE")
        print("=" * 70)
        print()

        print(f"Course: {course.title}")
        print(f"Course ID: {course.id}")
        print()

        print("YouTube Playlist:")
        print(PYTHON_PLAYLIST_URL)
        print()


        # ====================================================
        # CREATE / UPDATE ALL 10 MODULES
        # ====================================================

        for module_data in MODULES:

            module_order = module_data["order"]


            # ------------------------------------------------
            # FIND EXISTING MODULE
            # ------------------------------------------------

            existing_module = (
                db.query(Module)
                .filter(
                    Module.course_id == course.id,
                    Module.order_index == module_order,
                )
                .first()
            )


            # ------------------------------------------------
            # CREATE MODULE
            # ------------------------------------------------

            if not existing_module:

                module = Module(
                    id=str(uuid.uuid4()),
                    course_id=course.id,
                    title=module_data["title"],
                    order_index=module_order,
                )

                db.add(module)

                db.flush()

                print(
                    f"[CREATED] Module {module_order}: "
                    f"{module_data['title']}"
                )

            else:

                module = existing_module

                module.title = module_data["title"]

                print(
                    f"[UPDATED] Module {module_order}: "
                    f"{module_data['title']}"
                )


            # =================================================
            # FIND LECTURES
            # =================================================

            lectures = (
                db.query(Lecture)
                .filter(
                    Lecture.module_id == module.id
                )
                .order_by(
                    Lecture.order_index.asc()
                )
                .all()
            )


            # =================================================
            # UPDATE EXISTING LECTURE
            # =================================================

            if lectures:

                lecture = lectures[0]

                lecture.title = module_data["lecture"]

                lecture.description = (
                    module_data["description"]
                )

                lecture.video_url = (
                    module_data["video_url"]
                )

                lecture.duration_seconds = (
                    module_data["duration_seconds"]
                )

                lecture.order_index = 1

                # Keep existing resources if available.
                if not lecture.resource_urls:

                    lecture.resource_urls = [
                        PYTHON_PLAYLIST_URL
                    ]

                print(
                    f"          [VIDEO UPDATED]"
                )

                print(
                    f"          {lecture.title}"
                )

                print(
                    f"          {lecture.video_url}"
                )


            # =================================================
            # CREATE LECTURE
            # =================================================

            else:

                lecture = Lecture(
                    id=str(uuid.uuid4()),

                    module_id=module.id,

                    title=module_data["lecture"],

                    description=(
                        module_data["description"]
                    ),

                    video_url=(
                        module_data["video_url"]
                    ),

                    transcript=None,

                    duration_seconds=(
                        module_data["duration_seconds"]
                    ),

                    order_index=1,

                    resource_urls=[
                        PYTHON_PLAYLIST_URL
                    ],
                )

                db.add(lecture)

                print(
                    f"          [LECTURE CREATED]"
                )

                print(
                    f"          {lecture.title}"
                )

                print(
                    f"          {lecture.video_url}"
                )


            print()


        # ====================================================
        # SAVE EVERYTHING
        # ====================================================

        db.commit()


        # ====================================================
        # FINAL VERIFICATION
        # ====================================================

        modules = (
            db.query(Module)
            .filter(
                Module.course_id == course.id
            )
            .order_by(
                Module.order_index.asc()
            )
            .all()
        )


        print()
        print("=" * 70)
        print("FINAL PYTHON COURSE STRUCTURE")
        print("=" * 70)
        print()


        videos_connected = 0


        for module in modules:

            lecture = (
                db.query(Lecture)
                .filter(
                    Lecture.module_id == module.id
                )
                .order_by(
                    Lecture.order_index.asc()
                )
                .first()
            )


            if lecture:

                if lecture.video_url:

                    videos_connected += 1

                    video_status = "YOUTUBE CONNECTED"

                else:

                    video_status = "NO VIDEO"


                print(
                    f"{module.order_index:2}. "
                    f"{module.title}"
                )

                print(
                    f"    Lecture : {lecture.title}"
                )

                print(
                    f"    Status  : {video_status}"
                )

                print(
                    f"    Video   : {lecture.video_url}"
                )

            else:

                print(
                    f"{module.order_index:2}. "
                    f"{module.title}"
                )

                print(
                    "    Status  : NO LECTURE"
                )

            print()


        # ====================================================
        # SUMMARY
        # ====================================================

        print("=" * 70)
        print("PYTHON COURSE UPDATE COMPLETE")
        print("=" * 70)
        print()

        print(
            f"TOTAL MODULES      : {len(modules)}"
        )

        print(
            f"YOUTUBE VIDEOS     : {videos_connected}"
        )

        print()

        if len(modules) >= 10:

            print(
                "10 PYTHON MODULES SUCCESSFULLY AVAILABLE."
            )

        if videos_connected >= 10:

            print(
                "10 YOUTUBE VIDEOS SUCCESSFULLY CONNECTED."
            )

        else:

            print(
                f"WARNING: Only "
                f"{videos_connected} videos connected."
            )

        print()

        print(
            "Playlist:"
        )

        print(
            PYTHON_PLAYLIST_URL
        )

        print()

        print("=" * 70)


    except Exception as error:

        db.rollback()

        print()
        print("=" * 70)
        print("PYTHON SEEDING ERROR")
        print("=" * 70)
        print()

        print(str(error))

        print()

        raise


    finally:

        db.close()


# ============================================================
# RUN
# ============================================================

if __name__ == "__main__":
    main()
    