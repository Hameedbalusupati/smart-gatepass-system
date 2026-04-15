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

        for _, row in df.iterrows():
            roll = None  # for error printing

            try:
                # ================= CLEAN DATA =================
                roll = str(row.get("roll_number", "")).strip().upper()
                name = str(row.get("name", "")).strip()
                phone = str(row.get("parent_number", "")).strip()
                image = str(row.get("image_path", "")).strip()

                if not roll or not name:
                    print("⚠️ Skipping invalid row")
                    continue

                # ================= FORCE CORRECT TYPES =================
                year = int(3)   # 🔥 ALWAYS INTEGER (CRITICAL)

                # ================= REQUIRED FIELDS =================
                email = f"{roll.lower()}@pace.ac.in"
                hashed_password = generate_password_hash("temp123")

                role = "student"
                department = "AIDS"
                section = "C"

                profile_path = f"uploads/student_images/{image}" if image else None

                # ================= PREVENT AUTOFLUSH BUG =================
                with db.session.no_autoflush:
                    existing = User.query.filter(
                        func.upper(User.college_id) == roll
                    ).first()

                # ================= UPDATE / INSERT =================
                if existing:
                    existing.name = name
                    existing.email = email
                    existing.parent_mobile = phone
                    existing.profile_image = profile_path
                    existing.department = department
                    existing.year = int(year)   # 🔥 FORCE AGAIN
                    existing.section = section

                    if not existing.password:
                        existing.password = hashed_password

                    print(f"🔄 Updated: {roll}")

                else:
                    user = User(
                        college_id=roll,
                        name=name,
                        email=email,
                        password=hashed_password,
                        role=role,
                        department=department,
                        year=int(year),   # 🔥 FORCE INTEGER
                        section=section,
                        profile_image=profile_path,
                        parent_mobile=phone
                    )

                    db.session.add(user)
                    print(f"✅ Added: {roll}")

            except Exception as row_error:
                db.session.rollback()   # 🔥 VERY IMPORTANT
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