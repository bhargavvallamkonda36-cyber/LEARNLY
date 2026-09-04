from app.database import SessionLocal
from app.models.course import Course

db = SessionLocal()

try:
    courses = db.query(Course).all()

    deleted = False

    for course in courses:
        title = (course.title or "").strip().lower()

        if (
            "gentle introduction" in title
            or "mit opencourseware" in title
            or title == "a gentle introduction to programming using python"
        ):
            print(f"Deleting: {course.title} ({course.id})")
            db.delete(course)
            deleted = True

    if deleted:
        db.commit()
        print("✅ MIT course deleted successfully.")
    else:
        print("⚠️ MIT course was not found.")

finally:
    db.close()