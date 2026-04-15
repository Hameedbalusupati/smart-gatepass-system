import pandas as pd
from models import db, User
from app import create_app
from werkzeug.security import generate_password_hash
from sqlalchemy import func

app = create_app()

with app.app_context():
    try:
        # ================= LOAD EXCEL =================
        df = pd.read_excel("Student_dataset_phone_numbers.xlsm")
        print("📂 Excel Loaded Successfully")

        print("🧾 Excel Columns:", df.columns.tolist())

        for _, row in df.iterrows():
            roll = None

            try:
                # ================= BASIC FIELDS =================
                roll = str(row.get("roll_number", "")).strip().upper()
                name = str(row.get("name", "")).strip()

                if not roll or not name:
                    print("⚠️ Skipping invalid row")
                    continue

                # ================= PHONE =================
                phone = None
                for col in df.columns:
                    if col.strip().lower() in ["parent_number", "phone number", "phone", "mobile"]:
                        value = row[col]
                        if pd.notna(value):
                            phone = str(value).strip()
                        break

                # ================= SECTION =================
                section = None
                for col in df.columns:
                    if col.strip().lower() == "section":
                        value = row[col]
                        if pd.notna(value):
                            section = str(value).strip().upper()
                        break

                # ================= CLEAN =================
                if phone in ["nan", "", None]:
                    phone = None

                if section in ["nan", "", None]:
                    section = None

                # ================= FIXED DATA =================
                year = 3
                email = f"{roll.lower()}@pace.ac.in"
                hashed_password = generate_password_hash("temp123")

                role = "student"
                department = "AIDS"

                # 🔥 IMPORTANT: NO IMAGE FROM EXCEL
                profile_path = None

                # ================= CHECK EXISTING =================
                with db.session.no_autoflush:
                    existing = User.query.filter(
                        func.upper(User.college_id) == roll
                    ).first()

                # ================= UPDATE =================
                if existing:
                    existing.name = name
                    existing.email = email
                    existing.parent_mobile = phone
                    existing.department = department
                    existing.year = year
                    existing.section = section

                    # ❌ DO NOT overwrite existing Cloudinary image
                    if not existing.profile_image:
                        existing.profile_image = None

                    if not existing.password:
                        existing.password = hashed_password

                    print(f"🔄 Updated: {roll}")

                # ================= INSERT =================
                else:
                    user = User(
                        college_id=roll,
                        name=name,
                        email=email,
                        password=hashed_password,
                        role=role,
                        department=department,
                        year=year,
                        section=section,
                        profile_image=None,   # 🔥 IMPORTANT
                        parent_mobile=phone
                    )

                    db.session.add(user)
                    print(f"✅ Added: {roll}")

            except Exception as row_error:
                db.session.rollback()
                print(f"❌ Row Error ({roll}):", row_error)

        # ================= FINAL COMMIT =================
        try:
            db.session.commit()
            print("🎉 ALL students imported successfully")
        except Exception as commit_error:
            db.session.rollback()
            print("🔥 COMMIT ERROR:", commit_error)

    except Exception as e:
        print("🔥 IMPORT ERROR:", e)