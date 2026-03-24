from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token
from sqlalchemy.exc import IntegrityError
import os
import re

from models import db, User

auth_bp = Blueprint("auth_bp", __name__)


# =================================================
# REGISTER (FACULTY IMAGE REQUIRED ✅)
# =================================================
@auth_bp.route("/register", methods=["POST"])
def register():
    try:
        college_id = (request.form.get("college_id") or "").strip()
        name = (request.form.get("name") or "").strip()
        email = (request.form.get("email") or "").strip().lower()
        password = request.form.get("password")
        role = (request.form.get("role") or "").strip().lower()

        department = (request.form.get("department") or "").strip().upper()
        year = request.form.get("year")
        section = (request.form.get("section") or "").strip().upper()

        image = request.files.get("profile_image")  # used for both student & faculty

        # ================= VALIDATION =================
        if not college_id or not name or not email or not password or not role:
            return jsonify({"message": "All fields are required"}), 400

        if role not in ["student", "faculty", "hod", "security"]:
            return jsonify({"message": "Invalid role"}), 400

        # ================= EMAIL =================
        parts = email.split("@")
        if len(parts) != 2:
            return jsonify({"message": "Invalid email"}), 400

        email_user, domain = parts

        if domain != "pace.ac.in":
            return jsonify({"message": "Use college email"}), 400

        # ================= STUDENT RULE =================
        if role == "student":
            if email_user != college_id.lower():
                return jsonify({"message": "Email must match roll number"}), 400

        # ================= FACULTY RULE =================
        if role == "faculty":
            if not college_id.isdigit():
                return jsonify({"message": "Faculty ID must be numeric"}), 400

            # 🔥 REQUIRED IMAGE FOR FACULTY
            if not image:
                return jsonify({"message": "Faculty image is required"}), 400

        # ================= ROLE =================
        if role in ["student", "faculty"] and (not year or not section):
            return jsonify({"message": "Year & Section required"}), 400

        try:
            year = int(year) if year else None
        except:
            return jsonify({"message": "Invalid year"}), 400

        # ================= IMAGE SAVE =================
        profile_path = None

        BASE_DIR = os.path.dirname(os.path.abspath(__file__))
        STUDENT_FOLDER = os.path.join(BASE_DIR, "..", "uploads/student_images")
        FACULTY_FOLDER = os.path.join(BASE_DIR, "..", "uploads/faculty_images")

        os.makedirs(STUDENT_FOLDER, exist_ok=True)
        os.makedirs(FACULTY_FOLDER, exist_ok=True)

        if role == "student" and image:
            path = os.path.join(STUDENT_FOLDER, f"{college_id}.jpg")
            image.save(path)
            profile_path = path

        if role == "faculty" and image:
            path = os.path.join(FACULTY_FOLDER, f"faculty_{college_id}.jpg")
            image.save(path)
            profile_path = path

        # ================= CREATE USER =================
        user = User(
            college_id=college_id,
            name=name,
            email=email,
            password=generate_password_hash(password),
            role=role,
            department=department,
            year=year,
            section=section,
            profile_image=profile_path,
            face_image=None  # ❌ NOT USED
        )

        db.session.add(user)
        db.session.commit()

        return jsonify({"message": "Registered successfully"}), 201

    except IntegrityError:
        db.session.rollback()
        return jsonify({"message": "User already exists"}), 400

    except Exception as e:
        db.session.rollback()
        print("REGISTER ERROR:", e)
        return jsonify({"message": str(e)}), 500


# =================================================
# LOGIN
# =================================================
@auth_bp.route("/login", methods=["POST"])
def login():
    try:
        data = request.get_json()

        email = (data.get("email") or "").strip().lower()
        password = data.get("password")

        if not email or not password:
            return jsonify({"message": "Email & password required"}), 400

        user = User.query.filter_by(email=email).first()

        if not user or not check_password_hash(user.password, password):
            return jsonify({"message": "Invalid credentials"}), 401

        token = create_access_token(identity=str(user.id))

        return jsonify({
            "access_token": token,
            "role": user.role,
            "name": user.name,
            "id": user.id,
            "department": user.department
        }), 200

    except Exception as e:
        print("LOGIN ERROR:", e)
        return jsonify({"message": str(e)}), 500