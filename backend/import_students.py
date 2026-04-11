import pandas as pd
from models import db, User
from app import create_app

app = create_app()

with app.app_context():
    df = pd.read_excel("Student_dataset_phone_numbers.xlsm")

    for _, row in df.iterrows():
        existing = User.query.filter_by(college_id=row["roll_number"]).first()

        if not existing:
            user = User(
                college_id=row["roll_number"],
                name=row["name"],
                email=f"{row['roll_number']}@college.com",
                password="temp123",
                role="student",
                profile_image=row["image_path"],
                parent_mobile=str(row["phone number"])
            )

            db.session.add(user)

    db.session.commit()

print("✅ Data imported successfully")