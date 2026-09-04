import sqlite3
from pathlib import Path


# ============================================================
# DATABASE PATH
# ============================================================

DB_PATH = Path(__file__).resolve().parent / "learnly.db"


# ============================================================
# NEW USER COLUMNS
# ============================================================

NEW_COLUMNS = {
    "username": "TEXT",
    "student_id": "TEXT",
    "phone": "TEXT",
    "department": "TEXT",
    "year": "TEXT",
    "college": "TEXT",
}


def main():
    print("=" * 60)
    print("LEARNLY - Student Profile Database Upgrade")
    print("=" * 60)

    if not DB_PATH.exists():
        print(f"\nERROR: Database not found:")
        print(DB_PATH)
        return

    connection = sqlite3.connect(DB_PATH)

    try:
        cursor = connection.cursor()

        # ----------------------------------------------------
        # Check existing users table
        # ----------------------------------------------------

        cursor.execute(
            "PRAGMA table_info(users)"
        )

        existing_columns = {
            row[1]
            for row in cursor.fetchall()
        }

        print("\nExisting columns:")
        for column in sorted(existing_columns):
            print(f"  ✓ {column}")

        # ----------------------------------------------------
        # Add missing columns
        # ----------------------------------------------------

        for column, data_type in NEW_COLUMNS.items():

            if column not in existing_columns:

                cursor.execute(
                    f"ALTER TABLE users "
                    f"ADD COLUMN {column} {data_type}"
                )

                print(
                    f"\n✓ Added column: {column}"
                )

            else:
                print(
                    f"\n→ Already exists: {column}"
                )

        # ----------------------------------------------------
        # Create unique indexes
        # ----------------------------------------------------

        cursor.execute(
            """
            CREATE UNIQUE INDEX IF NOT EXISTS
            ix_users_username
            ON users(username)
            """
        )

        cursor.execute(
            """
            CREATE UNIQUE INDEX IF NOT EXISTS
            ix_users_student_id
            ON users(student_id)
            """
        )

        connection.commit()

        print("\n" + "=" * 60)
        print("DATABASE UPGRADE COMPLETED SUCCESSFULLY")
        print("=" * 60)

        # ----------------------------------------------------
        # Show final columns
        # ----------------------------------------------------

        cursor.execute(
            "PRAGMA table_info(users)"
        )

        final_columns = cursor.fetchall()

        print("\nUpdated users table:")

        for column in final_columns:
            print(f"  ✓ {column[1]}")

        print("\nYou can now start the backend normally.")

    except Exception as error:

        connection.rollback()

        print("\n" + "=" * 60)
        print("DATABASE UPGRADE FAILED")
        print("=" * 60)

        print(f"\nError: {error}")

    finally:
        connection.close()


if __name__ == "__main__":
    main()
    