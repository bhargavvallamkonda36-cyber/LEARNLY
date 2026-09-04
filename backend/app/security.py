from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.config import settings


# ==================================================
# PASSWORD HASHING
# ==================================================

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
)


def hash_password(password: str) -> str:
    """
    Hash a user's password.
    """
    return pwd_context.hash(password)


def verify_password(
    password: str,
    password_hash: str,
) -> bool:
    """
    Verify a plain password against its hash.
    """
    return pwd_context.verify(
        password,
        password_hash,
    )


# ==================================================
# JWT CONFIGURATION
# ==================================================

ALGORITHM = "HS256"


# ==================================================
# CREATE ACCESS TOKEN
# ==================================================

def create_access_token(
    user_id: str,
    roles: list[str],
) -> str:

    expire = (
        datetime.now(timezone.utc)
        + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    )

    payload = {
        "sub": str(user_id),
        "roles": roles,
        "type": "access",
        "exp": expire,
    }

    token = jwt.encode(
        payload,
        settings.JWT_SECRET,
        algorithm=ALGORITHM,
    )

    return token


# ==================================================
# DECODE ACCESS TOKEN
# ==================================================

def decode_access_token(token: str):

    try:

        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[ALGORITHM],
        )

        if payload.get("type") != "access":
            return None

        return payload

    except JWTError:
        return None