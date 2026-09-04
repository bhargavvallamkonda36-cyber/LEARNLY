from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User, Role

from app.schemas.auth import (
    RegisterRequest,
    LoginRequest,
    ProfileUpdateRequest,
    AuthResponse,
    UserOut,
)

from app.security import (
    hash_password,
    verify_password,
    create_access_token,
)

from app.dependencies import get_current_user


# ============================================================
# ROUTER
# ============================================================

router = APIRouter(
    prefix="/api/v1/auth",
    tags=["Auth"],
)


# ============================================================
# USER RESPONSE HELPER
# ============================================================

def user_out(user: User) -> UserOut:

    roles = [
        role.name
        for role in user.roles
    ]

    return UserOut(
        id=str(user.id),

        full_name=user.full_name,

        email=user.email,

        username=user.username,

        student_id=user.student_id,

        phone=user.phone,

        department=user.department,

        year=user.year,

        college=user.college,

        avatar_url=user.avatar_url,

        is_active=user.is_active,

        roles=roles,

        created_at=user.created_at,

        updated_at=user.updated_at,
    )


# ============================================================
# REGISTER
# ============================================================

@router.post(
    "/register",
    response_model=AuthResponse,
)
def register(
    data: RegisterRequest,
    db: Session = Depends(get_db),
):

    # --------------------------------------------------------
    # Clean email
    # --------------------------------------------------------

    email = str(
        data.email
    ).lower().strip()


    # --------------------------------------------------------
    # Check existing email
    # --------------------------------------------------------

    existing_user = (
        db.query(User)
        .filter(
            User.email == email
        )
        .first()
    )

    if existing_user:

        raise HTTPException(
            status_code=409,
            detail="Email already registered.",
        )


    # --------------------------------------------------------
    # Get student role
    # --------------------------------------------------------

    role = (
        db.query(Role)
        .filter(
            Role.name == "student"
        )
        .first()
    )


    # --------------------------------------------------------
    # Create role if missing
    # --------------------------------------------------------

    if not role:

        role = Role(
            name="student"
        )

        db.add(role)

        db.flush()


    # --------------------------------------------------------
    # Create user
    # --------------------------------------------------------

    user = User(

        full_name=
            data.full_name.strip(),

        email=email,

        password_hash=
            hash_password(
                data.password
            ),
    )


    # --------------------------------------------------------
    # Assign role
    # --------------------------------------------------------

    user.roles.append(role)

    db.add(user)


    # --------------------------------------------------------
    # Save
    # --------------------------------------------------------

    try:

        db.commit()

        db.refresh(user)

    except IntegrityError:

        db.rollback()

        raise HTTPException(
            status_code=409,
            detail="Email already registered.",
        )


    # --------------------------------------------------------
    # Roles
    # --------------------------------------------------------

    roles = [
        role.name
        for role in user.roles
    ]


    # --------------------------------------------------------
    # Token
    # --------------------------------------------------------

    access_token = create_access_token(
        str(user.id),
        roles,
    )


    # --------------------------------------------------------
    # Response
    # --------------------------------------------------------

    return AuthResponse(

        access_token=
            access_token,

        token_type="bearer",

        user=
            user_out(user),
    )


# ============================================================
# LOGIN
# ============================================================

@router.post(
    "/login",
    response_model=AuthResponse,
)
def login(
    data: LoginRequest,
    db: Session = Depends(get_db),
):

    # --------------------------------------------------------
    # Clean email
    # --------------------------------------------------------

    email = str(
        data.email
    ).lower().strip()


    # --------------------------------------------------------
    # Find user
    # --------------------------------------------------------

    user = (
        db.query(User)
        .filter(
            User.email == email
        )
        .first()
    )


    # --------------------------------------------------------
    # Validate user
    # --------------------------------------------------------

    if not user:

        raise HTTPException(
            status_code=401,
            detail="Invalid email or password.",
        )


    # --------------------------------------------------------
    # Validate password
    # --------------------------------------------------------

    if not verify_password(
        data.password,
        user.password_hash,
    ):

        raise HTTPException(
            status_code=401,
            detail="Invalid email or password.",
        )


    # --------------------------------------------------------
    # Account status
    # --------------------------------------------------------

    if not user.is_active:

        raise HTTPException(
            status_code=403,
            detail="Account is suspended.",
        )


    # --------------------------------------------------------
    # Roles
    # --------------------------------------------------------

    roles = [
        role.name
        for role in user.roles
    ]


    # --------------------------------------------------------
    # Token
    # --------------------------------------------------------

    access_token = create_access_token(
        str(user.id),
        roles,
    )


    # --------------------------------------------------------
    # Response
    # --------------------------------------------------------

    return AuthResponse(

        access_token=
            access_token,

        token_type="bearer",

        user=
            user_out(user),
    )


# ============================================================
# CURRENT USER
# ============================================================

@router.get(
    "/me",
    response_model=UserOut,
)
def me(
    user: User = Depends(
        get_current_user
    ),
):

    return user_out(user)


# ============================================================
# UPDATE CURRENT USER PROFILE
# ============================================================

@router.patch(
    "/me",
    response_model=UserOut,
)
def update_me(

    data: ProfileUpdateRequest,

    user: User = Depends(
        get_current_user
    ),

    db: Session = Depends(
        get_db
    ),
):

    # ========================================================
    # CLEAN VALUES
    # ========================================================

    full_name = (
        data.full_name
        .strip()
    )


    email = (
        str(data.email)
        .lower()
        .strip()
    )


    username = (
        data.username.strip()
        if data.username
        else None
    )


    student_id = (
        data.student_id.strip()
        if data.student_id
        else None
    )


    phone = (
        data.phone.strip()
        if data.phone
        else None
    )


    department = (
        data.department.strip()
        if data.department
        else None
    )


    year = (
        data.year.strip()
        if data.year
        else None
    )


    college = (
        data.college.strip()
        if data.college
        else None
    )


    avatar_url = (
        data.avatar_url.strip()
        if data.avatar_url
        else None
    )


    # ========================================================
    # VALIDATE FULL NAME
    # ========================================================

    if len(full_name) < 2:

        raise HTTPException(
            status_code=422,
            detail=(
                "Full name must contain "
                "at least 2 characters."
            ),
        )


    # ========================================================
    # CHECK EMAIL
    # ========================================================

    existing_email = (
        db.query(User)
        .filter(
            User.email == email,
            User.id != user.id,
        )
        .first()
    )


    if existing_email:

        raise HTTPException(
            status_code=409,
            detail="Email already exists.",
        )


    # ========================================================
    # CHECK USERNAME
    # ========================================================

    if username:

        existing_username = (
            db.query(User)
            .filter(
                User.username == username,
                User.id != user.id,
            )
            .first()
        )


        if existing_username:

            raise HTTPException(
                status_code=409,
                detail="Username already exists.",
            )


    # ========================================================
    # CHECK STUDENT ID
    # ========================================================

    if student_id:

        existing_student_id = (
            db.query(User)
            .filter(
                User.student_id == student_id,
                User.id != user.id,
            )
            .first()
        )


        if existing_student_id:

            raise HTTPException(
                status_code=409,
                detail="Student ID already exists.",
            )


    # ========================================================
    # UPDATE USER
    # ========================================================

    user.full_name = full_name

    user.email = email

    user.username = username

    user.student_id = student_id

    user.phone = phone

    user.department = department

    user.year = year

    user.college = college

    user.avatar_url = avatar_url


    # ========================================================
    # SAVE DATABASE
    # ========================================================

    try:

        db.add(user)

        db.commit()

        db.refresh(user)

    except IntegrityError:

        db.rollback()

        raise HTTPException(
            status_code=409,
            detail=(
                "Email, Username, "
                "or Student ID already exists."
            ),
        )


    # ========================================================
    # RETURN UPDATED USER
    # ========================================================

    return user_out(user)
