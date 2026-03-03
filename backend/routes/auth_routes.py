from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from flask_jwt_extended import create_access_token
from sqlalchemy.exc import IntegrityError
import os
import re

from models import db, User

auth_bp = Blueprint("auth_bp", __name__)

# =================================================
# IMAGE STORAGE SETUP
# =================================================
UPLOAD_FOLDER = "uploads/student_images"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


# =================================================
# REGISTER
# =================================================
@auth_bp.route("/register", methods=["POST"])
def register():
    try:
        # -------------------------------
        # GET FORM DATA (FormData)
        # -------------------------------
        college_id = (request.form.get("college_id") or "").strip()
        name = (request.form.get("name") or "").strip()
        email = (request.form.get("email") or "").strip()
        password = request.form.get("password")
        role = (request.form.get("role") or "").strip().lower()

        department = request.form.get("department")
        year = request.form.get("year")
        section = request.form.get("section")

        image = request.files.get("profile_image")

        # Convert email to lowercase (standard practice)
        email = email.lower()

        # -------------------------------
        # BASIC VALIDATION
        # -------------------------------
        if not college_id or not name or not email or not password or not role:
            return jsonify({"message": "All fields are required"}), 400

        if role not in ["student", "faculty", "hod", "security"]:
            return jsonify({"message": "Invalid role"}), 400

        # -------------------------------
        # STRICT COLLEGE EMAIL VALIDATION
        # Pattern example: 23KQ1A54G7@pace.ac.in
        # -------------------------------
        roll_pattern = r'^[0-9]{2}[A-Za-z]{2}[0-9][A-Za-z][0-9]{2}[A-Za-z0-9]+@pace\.ac\.in$'

        if not re.match(roll_pattern, email):
            return jsonify({
                "message": "Invalid college email format (e.g., 23KQ1A54G7@pace.ac.in)"
            }), 400

        # -------------------------------
        # ROLE-BASED VALIDATION
        # -------------------------------
        if role in ["student", "faculty"]:
            if not department or not year or not section:
                return jsonify({
                    "message": "Department, Year and Section are required"
                }), 400

            try:
                year = int(year)
            except Exception:
                return jsonify({"message": "Invalid year format"}), 400

        elif role == "hod":
            year = None
            section = None

        else:  # security
            department = None
            year = None
            section = None

        # -------------------------------
        # IMAGE VALIDATION (STUDENT ONLY)
        # -------------------------------
        image_path = None

        if role == "student":
            if not image:
                return jsonify({
                    "message": "Student profile image is required"
                }), 400

            filename = secure_filename(college_id.upper() + ".jpg")
            image_path = os.path.join(UPLOAD_FOLDER, filename)
            image.save(image_path)

        # -------------------------------
        # CREATE USER
        # -------------------------------
        user = User(
            college_id=college_id.upper(),
            name=name,
            email=email,
            password=generate_password_hash(password),
            role=role,
            department=department,
            year=year,
            section=section,
            profile_image=image_path
        )

        db.session.add(user)
        db.session.commit()

        return jsonify({"message": "Registered successfully"}), 201

    except IntegrityError:
        db.session.rollback()
        return jsonify({
            "message": "Email or College ID already exists"
        }), 400

    except Exception as e:
        db.session.rollback()
        print("REGISTER ERROR:", e)
        return jsonify({
            "message": "Internal server error"
        }), 500


# =================================================
# LOGIN
# =================================================
@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()

    if not data:
        return jsonify({"message": "Invalid JSON data"}), 400

    email = (data.get("email") or "").strip().lower()
    password = data.get("password")

    if not email or not password:
        return jsonify({"message": "Email and password required"}), 400

    user = User.query.filter_by(email=email).first()

    if not user or not check_password_hash(user.password, password):
        return jsonify({"message": "Invalid credentials"}), 401

    token = create_access_token(identity=str(user.id))

    return jsonify({
        "access_token": token,
        "role": user.role,
        "name": user.name,
        "id": user.id
    }), 200