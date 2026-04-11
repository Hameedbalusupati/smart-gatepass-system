import pandas as pd
from models import db, User
from app import create_app
from werkzeug.security import generate_password_hash

app = create_app()

with app.app_context():
    try:
        # ================= LOAD EXCEL =================
        df = pd.read_excel("Student_dataset_phone_numbers.xlsm")

        print("📂 Excel Loaded Successfully")

        for _, row in df.iterrows():
            try:
                # ================= CLEAN DATA =================
                roll = str(row.get("roll_number", "")).strip()
                name = str(row.get("name", "")).strip()
                phone = str(row.get("phone number", "")).strip()
                image = str(row.get("image_path", "")).strip()

                # Skip invalid rows
                if not roll or not name:
                    print("⚠️ Skipping invalid row:", row)
                    continue

                email = f"{roll}@college.com"

                # ================= CHECK EXISTING =================
                existing = User.query.filter_by(college_id=roll).first()

                if existing:
                    # 🔥 UPDATE EXISTING USER
                    existing.name = name
                    existing.parent_mobile = phone
                    existing.profile_image = image

                    print(f"🔄 Updated: {roll}")

                else:
                    # 🔥 CREATE NEW USER
                    user = User(
                        college_id=roll,
                        name=name,
                        email=email,
                        password=generate_password_hash("temp123"),  # 🔐 SECURE
                        role="student",
                        profile_image=image,
                        parent_mobile=phone
                    )

                    db.session.add(user)

                    print(f"✅ Added: {roll}")

            except Exception as row_error:
                print("❌ Row Error:", row_error)

        db.session.commit()
        print("🎉 Data imported successfully")

    except Exception as e:
        print("🔥 IMPORT ERROR:", e)