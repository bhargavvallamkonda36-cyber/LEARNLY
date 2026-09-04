import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.course import (
    Course,
    Module,
    Lecture,
    Enrollment,
    LectureProgress,
)
from app.schemas.course import (
    CourseCreate,
    CourseOut,
    ModuleCreate,
    LectureCreate,
    EnrollmentOut,
)
from app.dependencies import require_roles


router = APIRouter(
    prefix="/api/v1",
    tags=["Courses"],
)


# =========================================================
# HELPERS
# =========================================================

def course_out(course: Course) -> CourseOut:
    """
    Convert SQLAlchemy Course model into API response.
    """

    return CourseOut(
        id=str(course.id),
        instructor_id=str(course.instructor_id),
        title=course.title,
        description=course.description,
        category=course.category,
        difficulty=course.difficulty,
        thumbnail_url=course.thumbnail_url,
        price=float(course.price or 0),
        status=course.status,
    )


def is_admin(user: User) -> bool:
    """
    Check whether the current user has admin role.
    """

    return any(
        role.name == "admin"
        for role in user.roles
    )


# =========================================================
# MIT OPENCOURSEWARE
# =========================================================

MIT_OCW_COURSE_URL = (
    "https://ocw.mit.edu/courses/"
    "6-189-a-gentle-introduction-to-programming-using-python-january-iap-2008/"
)

MIT_OCW_LECTURE_NOTES_URL = (
    MIT_OCW_COURSE_URL + "pages/lecture-notes/"
)

MIT_OCW_LICENSE = "CC BY-NC-SA 4.0"


def mit_resource(
    resource_name: str,
    title: str,
    description: str,
) -> dict:
    """
    Create an MIT OpenCourseWare resource.
    """

    return {
        "title": title,
        "description": description,
        "url": (
            MIT_OCW_COURSE_URL
            + f"resources/{resource_name}/"
        ),
        "source": "MIT OpenCourseWare",
        "source_url": MIT_OCW_COURSE_URL,
        "resource_type": "Lecture Notes",
        "license": MIT_OCW_LICENSE,
    }


# =========================================================
# MIT COURSE RESOURCE MAP
# =========================================================

def get_mit_resources(
    module: Module,
    lecture: Lecture,
) -> list[dict]:
    """
    Return MIT OpenCourseWare resources for a lecture.
    """

    module_number = int(
        getattr(module, "order_index", 0) or 0
    )

    lecture_title = (
        lecture.title or ""
    ).lower().strip()

    resources = []

    # -----------------------------------------------------
    # Helper
    # -----------------------------------------------------

    def add(
        resource_name: str,
        title: str,
        description: str,
    ):
        if any(
            item["url"].endswith(
                f"/resources/{resource_name}/"
            )
            for item in resources
        ):
            return

        resources.append(
            mit_resource(
                resource_name,
                title,
                description,
            )
        )

    # =====================================================
    # MODULE 1
    # =====================================================

    if module_number == 1:

        if (
            "orientation" in lecture_title
            or "syllabus" in lecture_title
        ):
            add(
                "notes1",
                "Session 1 Notes — Syllabus & Python Introduction",
                (
                    "Official MIT OpenCourseWare notes containing "
                    "the syllabus, course information and an "
                    "introductory Python tutorial."
                ),
            )

        elif (
            "loop" in lecture_title
            or "control" in lecture_title
        ):
            add(
                "handout1",
                "Handout 1 — Loops",
                (
                    "MIT OpenCourseWare handout reviewing "
                    "while loops and the basics of for loops."
                ),
            )

        else:
            add(
                "notes1",
                "Session 1 Notes — Variables & Types",
                (
                    "Official MIT OpenCourseWare introductory "
                    "Python lecture notes."
                ),
            )

            add(
                "handout1",
                "Handout 1 — Loops",
                (
                    "MIT OpenCourseWare material covering "
                    "while loops and for loops."
                ),
            )

    # =====================================================
    # MODULE 2
    # =====================================================

    elif module_number == 2:

        add(
            "notes1",
            "Session 1 Notes — Variables & Types",
            (
                "MIT OpenCourseWare notes introducing "
                "Python variables, values and types."
            ),
        )

        add(
            "handout2",
            "Handout 2 — Python Review",
            (
                "MIT OpenCourseWare review covering "
                "functions, lists, for loops and tuples."
            ),
        )

    # =====================================================
    # MODULE 3
    # =====================================================

    elif module_number == 3:

        add(
            "handout1",
            "Handout 1 — Loops",
            (
                "MIT OpenCourseWare notes reviewing "
                "while loops and for loops."
            ),
        )

        add(
            "handout2",
            "Handout 2 — Functions, Lists & Loops",
            (
                "MIT OpenCourseWare review material "
                "covering functions, lists and loops."
            ),
        )

    # =====================================================
    # MODULE 4
    # =====================================================

    elif module_number == 4:

        add(
            "handout2",
            "Handout 2 — Functions, Lists & Loops",
            (
                "MIT OpenCourseWare review before the midterm "
                "covering functions, lists, for loops and tuples."
            ),
        )

        add(
            "notes6",
            "Session 6 Homework — Notes & Practice",
            (
                "MIT OpenCourseWare material that doubles "
                "as notes for classes 4 through 6."
            ),
        )

    # =====================================================
    # MODULE 5
    # =====================================================

    elif module_number == 5:

        add(
            "notes7",
            "Session 7 Homework — Lists",
            (
                "Optional MIT OpenCourseWare practice "
                "for working with Python lists."
            ),
        )

        add(
            "notes8",
            "Session 8 Notes — Dictionaries",
            (
                "MIT OpenCourseWare notes covering "
                "dictionaries and their usage."
            ),
        )

        add(
            "handout4",
            "Handout 4 — Dictionaries & Web Indexer",
            (
                "MIT OpenCourseWare handout reviewing "
                "dictionaries and introducing the Web Indexer lab."
            ),
        )

    # =====================================================
    # MODULE 6
    # =====================================================

    elif module_number == 6:

        add(
            "notes6",
            "Session 6 Homework — Notes & Practice",
            (
                "MIT OpenCourseWare notes and practice "
                "for classes 4 through 6."
            ),
        )

        add(
            "notes9",
            "Session 9 Worksheet — Common Errors",
            (
                "MIT OpenCourseWare worksheet reviewing "
                "common Python errors and good programming practices."
            ),
        )

    # =====================================================
    # MODULE 7
    # =====================================================

    elif module_number == 7:

        add(
            "handout3",
            "Handout 3 — Objects",
            (
                "MIT OpenCourseWare handout reviewing "
                "Python objects."
            ),
        )

        add(
            "handout4",
            "Handout 4 — Dictionaries & Web Indexer",
            (
                "MIT OpenCourseWare material covering "
                "dictionaries and the Web Indexer project."
            ),
        )

    # =====================================================
    # MODULE 8
    # =====================================================

    elif module_number == 8:

        add(
            "notes9",
            "Session 9 Worksheet — Common Errors",
            (
                "MIT OpenCourseWare worksheet reviewing "
                "common Python errors and good programming practices."
            ),
        )

        add(
            "notes8",
            "Session 8 Notes — Dictionaries",
            (
                "MIT OpenCourseWare notes for additional "
                "Python programming review."
            ),
        )

    # =====================================================
    # MODULE 9
    # =====================================================

    elif module_number == 9:

        add(
            "handout4",
            "Handout 4 — Web Indexer Part 1",
            (
                "MIT OpenCourseWare material covering "
                "dictionaries and part 1 of the Web Indexer lab."
            ),
        )

        add(
            "handout5",
            "Handout 5 — Web Indexer Part 2",
            (
                "MIT OpenCourseWare walkthrough for part 2 "
                "of the Web Indexer lab and compound dictionaries."
            ),
        )

    # =====================================================
    # MODULE 10
    # =====================================================

    elif module_number == 10:

        add(
            "notes8",
            "Session 8 Notes — Dictionaries",
            (
                "MIT OpenCourseWare notes covering "
                "dictionaries and their usage."
            ),
        )

        add(
            "notes9",
            "Session 9 Worksheet — Common Errors",
            (
                "MIT OpenCourseWare worksheet reviewing "
                "common Python errors and good practices."
            ),
        )

        add(
            "handout5",
            "Handout 5 — Web Indexer Part 2",
            (
                "MIT OpenCourseWare advanced practice "
                "covering compound dictionaries."
            ),
        )

    # =====================================================
    # FALLBACK
    # =====================================================

    if not resources:

        add(
            "notes1",
            "MIT OpenCourseWare — Python Lecture Notes",
            (
                "Official MIT OpenCourseWare lecture notes "
                "for A Gentle Introduction to Programming "
                "Using Python."
            ),
        )

    return resources


# =========================================================
# LIST COURSES
# =========================================================

@router.get(
    "/courses",
    response_model=list[CourseOut],
)
def list_courses(
    q: str | None = None,
    category: str | None = None,
    difficulty: str | None = None,
    db: Session = Depends(get_db),
):
    """
    List all approved courses.
    """

    query = (
        db.query(Course)
        .filter(
            Course.status == "approved"
        )
    )

    if q:
        query = query.filter(
            Course.title.ilike(
                f"%{q}%"
            )
        )

    if category:
        query = query.filter(
            Course.category == category
        )

    if difficulty:
        query = query.filter(
            Course.difficulty == difficulty
        )

    courses = (
        query
        .order_by(
            Course.created_at.desc()
        )
        .all()
    )

    return [
        course_out(course)
        for course in courses
    ]


# =========================================================
# GET SINGLE COURSE
# =========================================================

@router.get(
    "/courses/{course_id}",
    response_model=CourseOut,
)
def get_course(
    course_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    """
    Get a single course by ID.
    """

    course_id_string = str(
        course_id
    )

    course = (
        db.query(Course)
        .filter(
            Course.id == course_id_string
        )
        .first()
    )

    if not course:
        raise HTTPException(
            status_code=404,
            detail="Course not found",
        )

    return course_out(course)


# =========================================================
# GET COURSE CONTENT
# =========================================================

@router.get(
    "/courses/{course_id}/content"
)
def get_course_content(
    course_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    """
    Return complete module/lecture structure.
    """

    course_id_string = str(
        course_id
    )

    course = (
        db.query(Course)
        .filter(
            Course.id == course_id_string
        )
        .first()
    )

    if not course:
        raise HTTPException(
            status_code=404,
            detail="Course not found",
        )

    modules = (
        db.query(Module)
        .filter(
            Module.course_id ==
            course_id_string
        )
        .order_by(
            Module.order_index.asc()
        )
        .all()
    )

    result = []

    for module in modules:

        lectures = (
            db.query(Lecture)
            .filter(
                Lecture.module_id ==
                str(module.id)
            )
            .order_by(
                Lecture.order_index.asc()
            )
            .all()
        )

        result.append(
            {
                "id": str(module.id),
                "course_id": str(
                    module.course_id
                ),
                "title": module.title,
                "order_index":
                    module.order_index,

                "lectures": [
                    {
                        "id": str(
                            lecture.id
                        ),

                        "module_id": str(
                            lecture.module_id
                        ),

                        "title":
                            lecture.title,

                        "description":
                            lecture.description,

                        "video_url":
                            lecture.video_url,

                        "transcript":
                            lecture.transcript,

                        "duration_seconds":
                            lecture.duration_seconds,

                        "order_index":
                            lecture.order_index,

                        "resource_urls":
                            lecture.resource_urls
                            or [],

                        "mit_resources":
                            get_mit_resources(
                                module,
                                lecture,
                            ),
                    }

                    for lecture
                    in lectures
                ],
            }
        )

    return result


# =========================================================
# ⭐ GET COURSE MODULES
# =========================================================
#
# THIS IS THE FIX FOR:
#
# 405 Method Not Allowed
#
# The AI Tutor frontend calls:
#
# GET /api/v1/courses/{course_id}/modules
#
# =========================================================

@router.get(
    "/courses/{course_id}/modules"
)
def get_course_modules(
    course_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    """
    Return all modules belonging to a course.

    Used by the Learnly AI Tutor course/module selector.
    """

    course_id_string = str(
        course_id
    )

    # -----------------------------------------------------
    # Check course exists
    # -----------------------------------------------------

    course = (
        db.query(Course)
        .filter(
            Course.id == course_id_string
        )
        .first()
    )

    if not course:
        raise HTTPException(
            status_code=404,
            detail="Course not found",
        )

    # -----------------------------------------------------
    # Get modules
    # -----------------------------------------------------

    modules = (
        db.query(Module)
        .filter(
            Module.course_id ==
            course_id_string
        )
        .order_by(
            Module.order_index.asc()
        )
        .all()
    )

    # -----------------------------------------------------
    # Return modules
    # -----------------------------------------------------

    return [
        {
            "id": str(module.id),

            "course_id": str(
                module.course_id
            ),

            "title": module.title,

            "order_index":
                module.order_index,
        }

        for module in modules
    ]


# =========================================================
# CREATE COURSE
# =========================================================

@router.post(
    "/courses",
    response_model=CourseOut,
)
def create_course(
    data: CourseCreate,
    instructor: User = Depends(
        require_roles(
            "instructor",
            "admin",
        )
    ),
    db: Session = Depends(get_db),
):
    """
    Create a new course.
    """

    course_status = (
        "approved"
        if is_admin(instructor)
        else "pending"
    )

    course = Course(
        instructor_id=instructor.id,
        title=data.title,
        description=data.description,
        category=data.category,
        difficulty=data.difficulty,
        thumbnail_url=data.thumbnail_url,
        price=data.price,
        status=course_status,
    )

    db.add(course)

    db.commit()

    db.refresh(course)

    return course_out(course)


# =========================================================
# UPDATE COURSE
# =========================================================

@router.put(
    "/courses/{course_id}",
    response_model=CourseOut,
)
def update_course(
    course_id: uuid.UUID,
    data: CourseCreate,
    user: User = Depends(
        require_roles(
            "instructor",
            "admin",
        )
    ),
    db: Session = Depends(get_db),
):
    """Update a course owned by the current instructor."""

    course_id_string = str(course_id)
    course = (
        db.query(Course)
        .filter(Course.id == course_id_string)
        .first()
    )

    if not course:
        raise HTTPException(404, "Course not found")

    if not is_admin(user) and course.instructor_id != user.id:
        raise HTTPException(403, "You do not own this course")

    course.title = data.title.strip()
    course.description = data.description
    course.category = data.category
    course.difficulty = data.difficulty
    course.thumbnail_url = data.thumbnail_url
    course.price = data.price

    db.commit()
    db.refresh(course)
    return course_out(course)


# =========================================================
# DELETE COURSE
# =========================================================

@router.delete("/courses/{course_id}")
def delete_course(
    course_id: uuid.UUID,
    user: User = Depends(
        require_roles(
            "instructor",
            "admin",
        )
    ),
    db: Session = Depends(get_db),
):
    """Delete a course owned by the current instructor."""

    course_id_string = str(course_id)
    course = (
        db.query(Course)
        .filter(Course.id == course_id_string)
        .first()
    )

    if not course:
        raise HTTPException(404, "Course not found")

    if not is_admin(user) and course.instructor_id != user.id:
        raise HTTPException(403, "You do not own this course")

    db.delete(course)
    db.commit()

    return {
        "success": True,
        "message": "Course deleted successfully.",
        "course_id": course_id_string,
    }


# =========================================================
# CREATE MODULE
# =========================================================

@router.post(
    "/courses/{course_id}/modules"
)
def create_module(
    course_id: uuid.UUID,
    data: ModuleCreate,
    user: User = Depends(
        require_roles(
            "instructor",
            "admin",
        )
    ),
    db: Session = Depends(get_db),
):
    """
    Create a module inside a course.
    """

    course_id_string = str(
        course_id
    )

    course = (
        db.query(Course)
        .filter(
            Course.id ==
            course_id_string
        )
        .first()
    )

    if not course:
        raise HTTPException(
            status_code=404,
            detail="Course not found",
        )

    if (
        not is_admin(user)
        and course.instructor_id != user.id
    ):
        raise HTTPException(
            status_code=403,
            detail="You do not own this course",
        )

    module = Module(
        course_id=course.id,
        title=data.title,
        order_index=data.order_index,
    )

    db.add(module)

    db.commit()

    db.refresh(module)

    return {
        "id": str(module.id),

        "course_id": str(
            module.course_id
        ),

        "title": module.title,

        "order_index":
            module.order_index,
    }


# =========================================================
# CREATE LECTURE
# =========================================================

@router.post(
    "/modules/{module_id}/lectures"
)
def create_lecture(
    module_id: uuid.UUID,
    data: LectureCreate,
    user: User = Depends(
        require_roles(
            "instructor",
            "admin",
        )
    ),
    db: Session = Depends(get_db),
):
    """
    Create a lecture inside a module.
    """

    module_id_string = str(
        module_id
    )

    module = (
        db.query(Module)
        .filter(
            Module.id ==
            module_id_string
        )
        .first()
    )

    if not module:
        raise HTTPException(
            status_code=404,
            detail="Module not found",
        )

    course = (
        db.query(Course)
        .filter(
            Course.id ==
            str(module.course_id)
        )
        .first()
    )

    if not course:
        raise HTTPException(
            status_code=404,
            detail="Course not found",
        )

    if (
        not is_admin(user)
        and course.instructor_id != user.id
    ):
        raise HTTPException(
            status_code=403,
            detail="You do not own this course",
        )

    lecture = Lecture(
        module_id=module.id,
        title=data.title,
        description=data.description,
        video_url=data.video_url,
        transcript=data.transcript,
        duration_seconds=data.duration_seconds,
        order_index=data.order_index,
        resource_urls=data.resource_urls
        or [],
    )

    db.add(lecture)

    db.commit()

    db.refresh(lecture)

    return {
        "id": str(lecture.id),

        "module_id": str(
            lecture.module_id
        ),

        "title": lecture.title,

        "description":
            lecture.description,

        "video_url":
            lecture.video_url,

        "transcript":
            lecture.transcript,

        "duration_seconds":
            lecture.duration_seconds,

        "order_index":
            lecture.order_index,

        "resource_urls":
            lecture.resource_urls
            or [],
    }


# =========================================================
# LECTURE PLAYER
# =========================================================

@router.get(
    "/lectures/{lecture_id}",
)
def get_lecture_player(
    lecture_id: uuid.UUID,
    user: User = Depends(
        require_roles("student")
    ),
    db: Session = Depends(get_db),
):
    """
    Return everything required by the Lecture Player.
    """

    lecture_id_string = str(
        lecture_id
    )

    lecture = (
        db.query(Lecture)
        .filter(
            Lecture.id ==
            lecture_id_string
        )
        .first()
    )

    if not lecture:
        raise HTTPException(
            status_code=404,
            detail="Lecture not found",
        )

    module = (
        db.query(Module)
        .filter(
            Module.id ==
            str(lecture.module_id)
        )
        .first()
    )

    if not module:
        raise HTTPException(
            status_code=404,
            detail="Module not found",
        )

    course = (
        db.query(Course)
        .filter(
            Course.id ==
            str(module.course_id)
        )
        .first()
    )

    if not course:
        raise HTTPException(
            status_code=404,
            detail="Course not found",
        )

    enrollment = (
        db.query(Enrollment)
        .filter(
            Enrollment.user_id ==
            user.id,

            Enrollment.course_id ==
            course.id,
        )
        .first()
    )

    if not enrollment:
        raise HTTPException(
            status_code=403,
            detail=(
                "Enroll in this course "
                "before watching lectures"
            ),
        )

    modules = (
        db.query(Module)
        .filter(
            Module.course_id ==
            course.id
        )
        .order_by(
            Module.order_index.asc()
        )
        .all()
    )

    ordered_lectures = []

    for item_module in modules:

        module_lectures = (
            db.query(Lecture)
            .filter(
                Lecture.module_id ==
                item_module.id
            )
            .order_by(
                Lecture.order_index.asc()
            )
            .all()
        )

        for item_lecture in module_lectures:

            ordered_lectures.append(
                {
                    "lecture":
                        item_lecture,

                    "module":
                        item_module,
                }
            )

    current_index = next(
        (
            index
            for index, item
            in enumerate(
                ordered_lectures
            )

            if str(
                item["lecture"].id
            ) ==
            lecture_id_string
        ),

        None,
    )

    if current_index is None:
        raise HTTPException(
            status_code=404,
            detail=(
                "Lecture sequence "
                "could not be determined"
            ),
        )

    completed = (
        db.query(
            LectureProgress
        )
        .filter(
            LectureProgress.user_id ==
            user.id,

            LectureProgress.lecture_id ==
            lecture.id,
        )
        .first()
        is not None
    )

    total_lectures = len(
        ordered_lectures
    )

    completed_lectures = (
        db.query(
            LectureProgress
        )
        .join(
            Lecture,
            Lecture.id ==
            LectureProgress.lecture_id,
        )
        .join(
            Module,
            Module.id ==
            Lecture.module_id,
        )
        .filter(
            LectureProgress.user_id ==
            user.id,

            Module.course_id ==
            course.id,
        )
        .count()
    )

    progress_percent = (
        round(
            (
                completed_lectures
                /
                total_lectures
            ) * 100,
            2,
        )
        if total_lectures
        else 0
    )

    enrollment.progress_percent = (
        progress_percent
    )

    db.commit()

    previous_item = (
        ordered_lectures[
            current_index - 1
        ]
        if current_index > 0
        else None
    )

    next_item = (
        ordered_lectures[
            current_index + 1
        ]
        if current_index <
        total_lectures - 1
        else None
    )

    def lecture_summary(item):

        if not item:
            return None

        item_lecture = (
            item["lecture"]
        )

        item_module = (
            item["module"]
        )

        return {
            "lecture_id":
                str(item_lecture.id),

            "module_id":
                str(item_module.id),

            "module_title":
                item_module.title,

            "title":
                item_lecture.title,
        }

    return {
        "course": {
            "id":
                str(course.id),

            "title":
                course.title,
        },

        "module": {
            "id":
                str(module.id),

            "title":
                module.title,

            "order_index":
                module.order_index,
        },

        "lecture": {
            "id":
                str(lecture.id),

            "title":
                lecture.title,

            "description":
                lecture.description,

            "video_url":
                lecture.video_url,

            "transcript":
                lecture.transcript,

            "duration_seconds":
                lecture.duration_seconds,

            "order_index":
                lecture.order_index,

            "resource_urls":
                lecture.resource_urls
                or [],

            "mit_resources":
                get_mit_resources(
                    module,
                    lecture,
                ),
        },

        "navigation": {
            "current":
                current_index + 1,

            "total":
                total_lectures,

            "previous":
                lecture_summary(
                    previous_item
                ),

            "next":
                lecture_summary(
                    next_item
                ),
        },

        "completed":
            completed,

        "progress_percent":
            progress_percent,
    }


# =========================================================
# COMPLETE LECTURE
# =========================================================

@router.post(
    "/lectures/{lecture_id}/complete",
)
def complete_lecture(
    lecture_id: uuid.UUID,
    user: User = Depends(
        require_roles("student")
    ),
    db: Session = Depends(get_db),
):
    """
    Mark a lecture as completed
    and update course progress.
    """

    lecture_id_string = str(
        lecture_id
    )

    lecture = (
        db.query(Lecture)
        .filter(
            Lecture.id ==
            lecture_id_string
        )
        .first()
    )

    if not lecture:
        raise HTTPException(
            status_code=404,
            detail="Lecture not found",
        )

    module = (
        db.query(Module)
        .filter(
            Module.id ==
            str(lecture.module_id)
        )
        .first()
    )

    if not module:
        raise HTTPException(
            status_code=404,
            detail="Module not found",
        )

    course = (
        db.query(Course)
        .filter(
            Course.id ==
            str(module.course_id)
        )
        .first()
    )

    if not course:
        raise HTTPException(
            status_code=404,
            detail="Course not found",
        )

    enrollment = (
        db.query(Enrollment)
        .filter(
            Enrollment.user_id ==
            user.id,

            Enrollment.course_id ==
            course.id,
        )
        .first()
    )

    if not enrollment:
        raise HTTPException(
            status_code=403,
            detail=(
                "Enroll in this course first"
            ),
        )

    progress = (
        db.query(
            LectureProgress
        )
        .filter(
            LectureProgress.user_id ==
            user.id,

            LectureProgress.lecture_id ==
            lecture.id,
        )
        .first()
    )

    if not progress:

        progress = LectureProgress(
            user_id=user.id,
            lecture_id=lecture.id,
        )

        db.add(progress)

    total_lectures = (
        db.query(Lecture)
        .join(
            Module,
            Module.id ==
            Lecture.module_id,
        )
        .filter(
            Module.course_id ==
            course.id,
        )
        .count()
    )

    completed_lectures = (
        db.query(
            LectureProgress
        )
        .join(
            Lecture,
            Lecture.id ==
            LectureProgress.lecture_id,
        )
        .join(
            Module,
            Module.id ==
            Lecture.module_id,
        )
        .filter(
            LectureProgress.user_id ==
            user.id,

            Module.course_id ==
            course.id,
        )
        .count()
    )

    progress_percent = (
        round(
            (
                completed_lectures
                /
                total_lectures
            ) * 100,
            2,
        )
        if total_lectures
        else 0
    )

    enrollment.progress_percent = (
        progress_percent
    )

    db.commit()

    return {
        "message":
            "Lecture marked as completed",

        "lecture_id":
            str(lecture.id),

        "course_id":
            str(course.id),

        "completed":
            True,

        "completed_lectures":
            completed_lectures,

        "total_lectures":
            total_lectures,

        "progress_percent":
            progress_percent,
    }


# =========================================================
# COURSE PROGRESS
# =========================================================

@router.get(
    "/courses/{course_id}/progress",
)
def get_course_progress(
    course_id: uuid.UUID,
    user: User = Depends(
        require_roles("student")
    ),
    db: Session = Depends(get_db),
):
    """
    Return detailed lecture completion progress.
    """

    course_id_string = str(
        course_id
    )

    course = (
        db.query(Course)
        .filter(
            Course.id ==
            course_id_string
        )
        .first()
    )

    if not course:
        raise HTTPException(
            status_code=404,
            detail="Course not found",
        )

    enrollment = (
        db.query(Enrollment)
        .filter(
            Enrollment.user_id ==
            user.id,

            Enrollment.course_id ==
            course.id,
        )
        .first()
    )

    if not enrollment:
        raise HTTPException(
            status_code=403,
            detail=(
                "Enroll in this course first"
            ),
        )

    lectures = (
        db.query(Lecture)
        .join(
            Module,
            Module.id ==
            Lecture.module_id,
        )
        .filter(
            Module.course_id ==
            course.id,
        )
        .order_by(
            Module.order_index.asc(),
            Lecture.order_index.asc(),
        )
        .all()
    )

    completed_ids = {
        str(row.lecture_id)
        for row in (
            db.query(
                LectureProgress
            )
            .filter(
                LectureProgress.user_id ==
                user.id,
            )
            .all()
        )
    }

    completed_count = sum(
        str(lecture.id)
        in completed_ids
        for lecture in lectures
    )

    total_count = len(
        lectures
    )

    progress_percent = (
        round(
            (
                completed_count
                /
                total_count
            ) * 100,
            2,
        )
        if total_count
        else 0
    )

    enrollment.progress_percent = (
        progress_percent
    )

    db.commit()

    return {
        "course_id":
            str(course.id),

        "course_title":
            course.title,

        "completed_lecture_ids": [
            str(lecture.id)

            for lecture in lectures

            if str(lecture.id)
            in completed_ids
        ],

        "completed_lectures":
            completed_count,

        "total_lectures":
            total_count,

        "progress_percent":
            progress_percent,
    }


# =========================================================
# ENROLL IN COURSE
# =========================================================

@router.post(
    "/courses/{course_id}/enroll",
    response_model=EnrollmentOut,
)
def enroll(
    course_id: uuid.UUID,
    user: User = Depends(
        require_roles("student")
    ),
    db: Session = Depends(get_db),
):
    """
    Enroll current student in an approved course.
    """

    course_id_string = str(
        course_id
    )

    course = (
        db.query(Course)
        .filter(
            Course.id ==
            course_id_string
        )
        .first()
    )

    if (
        not course
        or course.status != "approved"
    ):
        raise HTTPException(
            status_code=404,
            detail=(
                "Approved course not found"
            ),
        )

    existing = (
        db.query(Enrollment)
        .filter(
            Enrollment.user_id ==
            user.id,

            Enrollment.course_id ==
            course.id,
        )
        .first()
    )

    if existing:

        return EnrollmentOut(
            id=str(
                existing.id
            ),

            course_id=str(
                existing.course_id
            ),

            progress_percent=float(
                existing.progress_percent
                or 0
            ),
        )

    enrollment = Enrollment(
        user_id=user.id,
        course_id=course.id,
        progress_percent=0,
    )

    db.add(enrollment)

    db.commit()

    db.refresh(enrollment)

    return EnrollmentOut(
        id=str(
            enrollment.id
        ),

        course_id=str(
            enrollment.course_id
        ),

        progress_percent=float(
            enrollment.progress_percent
            or 0
        ),
    )


# =========================================================
# MY ENROLLMENTS
# =========================================================

@router.get(
    "/enrollments/me",
    response_model=list[EnrollmentOut],
)
def my_enrollments(
    user: User = Depends(
        require_roles("student")
    ),
    db: Session = Depends(get_db),
):
    """
    Get courses in which the current student is enrolled.
    """

    enrollments = (
        db.query(Enrollment)
        .filter(
            Enrollment.user_id ==
            user.id
        )
        .order_by(
            Enrollment.enrolled_at.desc()
        )
        .all()
    )

    return [
        EnrollmentOut(
            id=str(
                enrollment.id
            ),

            course_id=str(
                enrollment.course_id
            ),

            progress_percent=float(
                enrollment.progress_percent
                or 0
            ),
        )

        for enrollment
        in enrollments
    ]
