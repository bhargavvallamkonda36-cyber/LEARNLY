import uuid

from fastapi import (
    APIRouter,
    Body,
    Depends,
    HTTPException,
    Query,
)

from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import require_roles

from app.models.user import (
    User,
    Role,
)

from app.models.course import (
    Course,
    Module,
    Lecture,
    Enrollment,
)


# ============================================================
# ROUTER
# ============================================================

router = APIRouter(
    prefix="/api/v1/admin",
    tags=["Admin"],
)


# ============================================================
# HELPERS
# ============================================================

def user_roles(user: User):
    """
    Return role names for a user.
    """

    return [
        role.name
        for role in user.roles
    ]


# ============================================================
# USER RESPONSE
# ============================================================

def user_out(user: User):
    """
    Convert User model to JSON-safe response.
    """

    return {
        "id": str(user.id),

        "full_name":
            user.full_name,

        "email":
            user.email,

        "username":
            user.username,

        "student_id":
            user.student_id,

        "phone":
            user.phone,

        "department":
            user.department,

        "year":
            user.year,

        "college":
            user.college,

        "avatar_url":
            user.avatar_url,

        "is_active":
            bool(user.is_active),

        "roles":
            user_roles(user),

        "created_at":
            user.created_at,

        "updated_at":
            user.updated_at,
    }


# ============================================================
# COURSE RESPONSE
# ============================================================

def course_out(
    course: Course,
    db: Session,
):
    """
    Convert Course model to Admin course response.
    """

    instructor = (
        db.query(User)
        .filter(
            User.id ==
            course.instructor_id
        )
        .first()
    )


    # --------------------------------------------------------
    # STUDENTS
    # --------------------------------------------------------

    students = (
        db.query(
            func.count(
                func.distinct(
                    Enrollment.user_id
                )
            )
        )
        .filter(
            Enrollment.course_id ==
            course.id
        )
        .scalar()
        or 0
    )


    # --------------------------------------------------------
    # MODULES
    # --------------------------------------------------------

    modules = (
        db.query(
            func.count(
                Module.id
            )
        )
        .filter(
            Module.course_id ==
            course.id
        )
        .scalar()
        or 0
    )


    # --------------------------------------------------------
    # LECTURES
    # --------------------------------------------------------

    lectures = (
        db.query(
            func.count(
                Lecture.id
            )
        )
        .join(
            Module,
            Module.id ==
            Lecture.module_id,
        )
        .filter(
            Module.course_id ==
            course.id
        )
        .scalar()
        or 0
    )


    return {
        "id":
            str(course.id),

        "title":
            course.title,

        "description":
            course.description,

        "category":
            course.category,

        "difficulty":
            course.difficulty,

        "thumbnail_url":
            course.thumbnail_url,

        "price":
            float(course.price or 0),

        "status":
            course.status,

        "instructor_id":
            str(course.instructor_id),

        "instructor_name":
            (
                instructor.full_name
                if instructor
                else "Unknown"
            ),

        "instructor_email":
            (
                instructor.email
                if instructor
                else ""
            ),

        "student_count":
            int(students),

        "module_count":
            int(modules),

        "lecture_count":
            int(lectures),

        "created_at":
            course.created_at,
    }


# ============================================================
# PLATFORM OVERVIEW
# ============================================================

@router.get(
    "/analytics/overview"
)
def admin_analytics_overview(
    current_user: User = Depends(
        require_roles("admin")
    ),
    db: Session = Depends(get_db),
):

    # --------------------------------------------------------
    # USERS
    # --------------------------------------------------------

    total_users = (
        db.query(
            func.count(
                User.id
            )
        )
        .scalar()
        or 0
    )


    active_users = (
        db.query(
            func.count(
                User.id
            )
        )
        .filter(
            User.is_active.is_(True)
        )
        .scalar()
        or 0
    )


    suspended_users = (
        db.query(
            func.count(
                User.id
            )
        )
        .filter(
            User.is_active.is_(False)
        )
        .scalar()
        or 0
    )


    # --------------------------------------------------------
    # ROLE COUNTS
    # --------------------------------------------------------

    students = 0
    instructors = 0
    admins = 0

    all_users = (
        db.query(User)
        .all()
    )


    for user in all_users:

        roles = user_roles(user)

        if "student" in roles:
            students += 1

        if "instructor" in roles:
            instructors += 1

        if "admin" in roles:
            admins += 1


    # --------------------------------------------------------
    # COURSES
    # --------------------------------------------------------

    total_courses = (
        db.query(
            func.count(
                Course.id
            )
        )
        .scalar()
        or 0
    )


    approved_courses = (
        db.query(
            func.count(
                Course.id
            )
        )
        .filter(
            Course.status ==
            "approved"
        )
        .scalar()
        or 0
    )


    pending_courses = (
        db.query(
            func.count(
                Course.id
            )
        )
        .filter(
            Course.status ==
            "pending"
        )
        .scalar()
        or 0
    )


    rejected_courses = (
        db.query(
            func.count(
                Course.id
            )
        )
        .filter(
            Course.status ==
            "rejected"
        )
        .scalar()
        or 0
    )


    # --------------------------------------------------------
    # ENROLLMENTS
    # --------------------------------------------------------

    total_enrollments = (
        db.query(
            func.count(
                Enrollment.id
            )
        )
        .scalar()
        or 0
    )


    # --------------------------------------------------------
    # AVERAGE PROGRESS
    # --------------------------------------------------------

    average_progress = (
        db.query(
            func.avg(
                Enrollment.progress_percent
            )
        )
        .scalar()
    )

    if average_progress is None:
        average_progress = 0


    return {
        "total_users":
            int(total_users),

        "active_users":
            int(active_users),

        "suspended_users":
            int(suspended_users),

        "students":
            int(students),

        "instructors":
            int(instructors),

        "admins":
            int(admins),

        "total_courses":
            int(total_courses),

        "approved_courses":
            int(approved_courses),

        "pending_courses":
            int(pending_courses),

        "rejected_courses":
            int(rejected_courses),

        "total_enrollments":
            int(total_enrollments),

        "average_progress":
            round(
                float(
                    average_progress
                ),
                2,
            ),
    }


# ============================================================
# LIST USERS
# ============================================================

@router.get(
    "/users"
)
def admin_users(
    search: str | None = Query(
        default=None
    ),

    role: str | None = Query(
        default=None
    ),

    status: str | None = Query(
        default=None
    ),

    current_user: User = Depends(
        require_roles("admin")
    ),

    db: Session = Depends(get_db),
):

    query = db.query(User)


    # --------------------------------------------------------
    # SEARCH
    # --------------------------------------------------------

    if search:

        search_value = (
            f"%{search.strip()}%"
        )

        query = query.filter(
            (
                User.full_name.ilike(
                    search_value
                )
            )
            |
            (
                User.email.ilike(
                    search_value
                )
            )
        )


    # --------------------------------------------------------
    # STATUS
    # --------------------------------------------------------

    if status == "active":

        query = query.filter(
            User.is_active.is_(True)
        )

    elif status == "suspended":

        query = query.filter(
            User.is_active.is_(False)
        )


    # --------------------------------------------------------
    # FETCH
    # --------------------------------------------------------

    users = (
        query
        .order_by(
            User.created_at.desc()
        )
        .all()
    )


    result = []


    for user in users:

        roles = user_roles(user)


        if (
            role and
            role.lower()
            not in roles
        ):
            continue


        result.append(
            user_out(user)
        )


    return result


# ============================================================
# GET SINGLE USER
# ============================================================

@router.get(
    "/users/{user_id}"
)
def admin_user_detail(
    user_id: uuid.UUID,

    current_user: User = Depends(
        require_roles("admin")
    ),

    db: Session = Depends(get_db),
):

    user = (
        db.query(User)
        .filter(
            User.id ==
            str(user_id)
        )
        .first()
    )


    if not user:

        raise HTTPException(
            status_code=404,
            detail="User not found",
        )


    enrollments = (
        db.query(
            Enrollment
        )
        .filter(
            Enrollment.user_id ==
            user.id
        )
        .all()
    )


    enrollment_data = []


    for enrollment in enrollments:

        course = (
            db.query(Course)
            .filter(
                Course.id ==
                enrollment.course_id
            )
            .first()
        )


        enrollment_data.append({

            "id":
                str(enrollment.id),

            "course_id":
                str(
                    enrollment.course_id
                ),

            "course_title":
                (
                    course.title
                    if course
                    else "Unknown"
                ),

            "progress_percent":
                float(
                    enrollment.progress_percent
                    or 0
                ),
        })


    data = user_out(user)

    data["enrollments"] = (
        enrollment_data
    )


    return data


# ============================================================
# ASSIGN / REVOKE ROLE
# ============================================================

@router.put(
    "/users/{user_id}/role"
)
def update_user_role(
    user_id: uuid.UUID,

    action: str = Body(
        ...,
        embed=True,
    ),

    role_name: str = Body(
        ...,
        embed=True,
    ),

    current_user: User = Depends(
        require_roles("admin")
    ),

    db: Session = Depends(get_db),
):

    target = (
        db.query(User)
        .filter(
            User.id ==
            str(user_id)
        )
        .first()
    )


    if not target:

        raise HTTPException(
            status_code=404,
            detail="User not found",
        )


    role_name = (
        role_name
        .strip()
        .lower()
    )


    if role_name not in {
        "student",
        "instructor",
        "admin",
    }:

        raise HTTPException(
            status_code=400,
            detail=(
                "Role must be "
                "student, instructor, "
                "or admin."
            ),
        )


    role = (
        db.query(Role)
        .filter(
            Role.name ==
            role_name
        )
        .first()
    )


    if not role:

        role = Role(
            name=role_name
        )

        db.add(role)

        db.flush()


    action = (
        action
        .strip()
        .lower()
    )


    # --------------------------------------------------------
    # ASSIGN
    # --------------------------------------------------------

    if action == "assign":

        if role not in target.roles:

            target.roles.append(
                role
            )


    # --------------------------------------------------------
    # REVOKE
    # --------------------------------------------------------

    elif action == "revoke":

        if (
            target.id ==
            current_user.id
            and
            role_name ==
            "admin"
        ):

            raise HTTPException(
                status_code=400,
                detail=(
                    "You cannot revoke "
                    "your own admin role."
                ),
            )


        if role in target.roles:

            if len(
                target.roles
            ) <= 1:

                raise HTTPException(
                    status_code=400,
                    detail=(
                        "A user must have "
                        "at least one role."
                    ),
                )

            target.roles.remove(
                role
            )


    else:

        raise HTTPException(
            status_code=400,
            detail=(
                "Action must be "
                "assign or revoke."
            ),
        )


    db.commit()

    db.refresh(target)


    return user_out(
        target
    )


# ============================================================
# SUSPEND / ACTIVATE USER
# ============================================================

@router.put(
    "/users/{user_id}/suspend"
)
def update_user_status(
    user_id: uuid.UUID,

    is_active: bool = Body(
        ...,
        embed=True,
    ),

    current_user: User = Depends(
        require_roles("admin")
    ),

    db: Session = Depends(get_db),
):

    target = (
        db.query(User)
        .filter(
            User.id ==
            str(user_id)
        )
        .first()
    )


    if not target:

        raise HTTPException(
            status_code=404,
            detail="User not found",
        )


    if (
        target.id ==
        current_user.id
    ):

        raise HTTPException(
            status_code=400,
            detail=(
                "You cannot suspend "
                "your own account."
            ),
        )


    target.is_active = bool(
        is_active
    )


    db.commit()

    db.refresh(target)


    return {
        "message":
            (
                "User activated"
                if target.is_active
                else
                "User suspended"
            ),

        "user":
            user_out(target),
    }


# ============================================================
# DELETE USER
# ============================================================

@router.delete(
    "/users/{user_id}"
)
def delete_user(
    user_id: uuid.UUID,

    current_user: User = Depends(
        require_roles("admin")
    ),

    db: Session = Depends(get_db),
):

    target = (
        db.query(User)
        .filter(
            User.id ==
            str(user_id)
        )
        .first()
    )


    if not target:

        raise HTTPException(
            status_code=404,
            detail="User not found",
        )


    if (
        target.id ==
        current_user.id
    ):

        raise HTTPException(
            status_code=400,
            detail=(
                "You cannot delete "
                "your own account."
            ),
        )


    try:

        db.delete(
            target
        )

        db.commit()


    except IntegrityError:

        db.rollback()

        raise HTTPException(
            status_code=409,
            detail=(
                "This user has related "
                "learning data and cannot "
                "be deleted. Suspend the "
                "account instead."
            ),
        )


    return {
        "message":
            "User deleted successfully",

        "user_id":
            str(user_id),
    }


# ============================================================
# PENDING COURSE APPROVALS
# ============================================================

@router.get(
    "/courses/pending"
)
def pending_courses(
    current_user: User = Depends(
        require_roles("admin")
    ),

    db: Session = Depends(get_db),
):

    courses = (
        db.query(Course)
        .filter(
            Course.status ==
            "pending"
        )
        .order_by(
            Course.created_at.desc()
        )
        .all()
    )


    return [
        course_out(
            course,
            db,
        )
        for course in courses
    ]


# ============================================================
# ALL COURSES
# ============================================================

@router.get(
    "/courses"
)
def all_courses(
    status: str | None = Query(
        default=None
    ),

    current_user: User = Depends(
        require_roles("admin")
    ),

    db: Session = Depends(get_db),
):

    query = db.query(
        Course
    )


    if status:

        query = query.filter(
            Course.status ==
            status.lower()
        )


    courses = (
        query
        .order_by(
            Course.created_at.desc()
        )
        .all()
    )


    return [
        course_out(
            course,
            db,
        )
        for course in courses
    ]


# ============================================================
# COURSE APPROVAL / REJECTION
# ============================================================

@router.post(
    "/courses/{course_id}/decision"
)
def course_decision(
    course_id: uuid.UUID,

    decision: str = Body(
        ...,
        embed=True,
    ),

    comment: str = Body(
        default="",
        embed=True,
    ),

    current_user: User = Depends(
        require_roles("admin")
    ),

    db: Session = Depends(get_db),
):

    course = (
        db.query(Course)
        .filter(
            Course.id ==
            str(course_id)
        )
        .first()
    )


    if not course:

        raise HTTPException(
            status_code=404,
            detail="Course not found",
        )


    decision = (
        decision
        .strip()
        .lower()
    )


    if decision not in {
        "approved",
        "rejected",
    }:

        raise HTTPException(
            status_code=400,
            detail=(
                "Decision must be "
                "approved or rejected."
            ),
        )


    course.status = decision


    db.commit()

    db.refresh(course)


    return {
        "message":
            (
                "Course approved successfully."
                if decision ==
                "approved"
                else
                "Course rejected successfully."
            ),

        "decision":
            decision,

        "comment":
            comment,

        "course":
            course_out(
                course,
                db,
            ),
    }
