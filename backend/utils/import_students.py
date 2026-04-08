import pandas as pd
import os
import sys

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.append(BASE_DIR)

from app import app
from models import db, User


def import_students():
    try:
        file_path = os.path.join(os.path.dirname(__file__), "Student_dataset_phone_numbers.xlsm")

        print("📂 Loading Excel...")
        df = pd.read_excel(file_path, dtype=str)

        # Normalize column names
        df.columns = df.columns.str.strip().str.lower()

        print("📊 Columns:", df.columns.tolist())

        with app.app_context():
            updated = 0
            not_found = 0
            skipped = 0

            for index, row in df.iterrows():
                try:
                    # ✅ EXACT MATCH WITH YOUR FILE
                    college_id_excel = str(row.get("roll_number", "")).strip().upper()
                    parent_number = str(row.get("phone number", "")).strip()

                    # 🔥 Clean number
                    parent_number = parent_number.replace(".0", "").replace(" ", "")

                    if not college_id_excel or not parent_number:
                        print(f"⚠️ Skipping row {index}")
                        skipped += 1
                        continue

                    print(f"🔍 Checking: {college_id_excel}")

                    user = User.query.filter_by(college_id=college_id_excel).first()

                    if user:
                        user.parent_number = parent_number
                        print(f"✅ Updated: {college_id_excel}")
                        updated += 1
                    else:
                        print(f"❌ Not found: {college_id_excel}")
                        not_found += 1

                except Exception as e:
                    print(f"❌ Error row {index}: {e}")

            db.session.commit()

            print("\n🎉 DONE")
            print(f"✅ Updated: {updated}")
            print(f"❌ Not found: {not_found}")
            print(f"⚠️ Skipped: {skipped}")

    except Exception as e:
        print("❌ ERROR:", e)


if __name__ == "__main__":
    import_students()