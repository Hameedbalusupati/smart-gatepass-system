from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from flask_jwt_extended import create_access_token
from sqlalchemy.exc import IntegrityError
import os
import re

from models import db, User

# ✅ FACE IMPORT (DeepFace version)
from utils.face_utils import get_face_encoding

auth_bp = Blueprint("auth_bp", __name__)

UPLOAD_FOLDER = "uploads/student_images"
FACE_FOLDER = "uploads/faculty_faces"

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(FACE_FOLDER, exist_ok=True)


# =================================================
# REGISTER
# =================================================
@auth_bp.route("/register", methods=["POST"])
def register():

    try:

        college_id = (request.form.get("college_id") or "").strip()
        name = (request.form.get("name") or "").strip()
        email = (request.form.get("email") or "").strip()
        password = request.form.get("password")
        role = (request.form.get("role") or "").strip().lower()

        department = (request.form.get("department") or "").strip().upper()
        year = request.form.get("year")
        section = (request.form.get("section") or "").strip().upper()

        # FILES
        image = request.files.get("profile_image")   # student
        face_file = request.files.get("face_image")  # faculty

        # ================= BASIC VALIDATION =================
        if not college_id or not name or not email or not password or not role:
            return jsonify({"message": "All fields are required"}), 400

        if role not in ["student", "faculty", "hod", "security"]:
            return jsonify({"message": "Invalid role"}), 400

        # ================= EMAIL VALIDATION =================
        parts = email.split("@")

        if len(parts) != 2:
            return jsonify({"message": "Invalid email format"}), 400

        email_user = parts[0]
        domain = parts[1]

        if domain.lower() != "pace.ac.in":
            return jsonify({"message": "Email must end with @pace.ac.in"}), 400

        # ================= STUDENT RULE =================
        if role == "student":
            if email_user.lower() != college_id.lower():
                return jsonify({
                    "message": "Student email must match Roll Number"
                }), 400

        # ================= FACULTY RULE =================
        if role == "faculty":

            if not college_id.isdigit():
                return jsonify({
                    "message": "Faculty college ID must contain numbers only"
                }), 400

            pattern = r'^[a-zA-Z]+_[a-zA-Z]$'
            if not re.match(pattern, email_user):
                return jsonify({
                    "message": "Faculty email must be like venkat_p@pace.ac.in"
                }), 400

        # ================= ROLE VALIDATION =================
        if role in ["student", "faculty", "hod"]:
            if not department:
                return jsonify({"message": "Department is required"}), 400

        if role in ["student", "faculty"]:
            if not year or not section:
                return jsonify({
                    "message": "Year and Section are required"
                }), 400

            try:
                year = int(year)
            except:
                return jsonify({"message": "Invalid year format"}), 400
        else:
            year = None
            section = None

        if role == "security":
            department = None
            year = None
            section = None

        # ================= STUDENT IMAGE =================
        image_path = None

        if role == "student":

            if not image:
                return jsonify({
                    "message": "Student profile image is required"
                }), 400

            filename = secure_filename(college_id + ".jpg")
            image_path = os.path.join(UPLOAD_FOLDER, filename)
            image.save(image_path)

        # ================= FACULTY FACE =================
        face_path = None

        if role == "faculty":

            if not face_file:
                return jsonify({
                    "message": "Faculty face image is required"
                }), 400

            filename = secure_filename(college_id + "_face.jpg")
            face_path = os.path.join(FACE_FOLDER, filename)

            # save face image
            face_file.save(face_path)

            # optional: validate face using DeepFace
            encoding = get_face_encoding(face_file)

            if encoding is None:
                return jsonify({
                    "message": "No face detected in image"
                }), 400

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
            profile_image=image_path,
            face_encoding=face_path   # ✅ STORE IMAGE PATH
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

    try:

        data = request.get_json()

        email = (data.get("email") or "").strip()
        password = data.get("password")

        if not email or not password:
            return jsonify({
                "message": "Email and password required"
            }), 400

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

        return jsonify({
            "message": "Internal server error"
        }), 500