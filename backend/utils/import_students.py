import pandas as pd
import os
import sys

# ✅ Fix import path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app import app
from database import db
from models import User


def import_students():
    try:
        # 📄 Excel file path
        file_path = os.path.join(os.path.dirname(__file__), "Student_dataset_phone_numbers.xlsm")

        print("📂 Loading Excel file...")
        df = pd.read_excel(file_path)

        # ✅ Normalize column names
        df.columns = df.columns.str.strip().str.lower()

        print("📊 Columns:", df.columns.tolist())

        with app.app_context():
            updated = 0
            not_found = 0
            skipped = 0

            for index, row in df.iterrows():
                try:
                    # ✅ Read Excel values
                    college_id_excel = str(row.get("roll_number", "")).strip()
                    parent_number = str(row.get("phone number", "")).strip()

                    if not college_id_excel or not parent_number:
                        print(f"⚠️ Skipping row {index} (missing data)")
                        skipped += 1
                        continue

                    # 🔥 Normalize for matching
                    college_id_clean = college_id_excel.lower()

                    print(f"🔍 Checking Excel ID: {college_id_excel}")

                    # ✅ CASE-INSENSITIVE MATCH
                    user = User.query.filter(
                        db.func.lower(User.college_id) == college_id_clean
                    ).first()

                    if user:
                        user.parent_number = parent_number
                        print(f"✅ Updated: {college_id_excel} → {user.college_id}")
                        updated += 1
                    else:
                        print(f"❌ Not found in DB: {college_id_excel}")
                        not_found += 1

                except Exception as row_error:
                    print(f"❌ Error in row {index}: {row_error}")

            db.session.commit()

            print("\n🎉 Import completed!")
            print(f"✅ Total updated: {updated}")
            print(f"❌ Not found: {not_found}")
            print(f"⚠️ Skipped: {skipped}")

    except FileNotFoundError:
        print("❌ Excel file not found. Check path.")
    except Exception as e:
        print("❌ ERROR:", e)


if __name__ == "__main__":
    import_students()