from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from flask_jwt_extended import create_access_token
from sqlalchemy.exc import IntegrityError
import os
import re

from models import db, User

auth_bp = Blueprint("auth_bp", __name__)

UPLOAD_FOLDER = "uploads/student_images"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


# =================================================
# REGISTER
# =================================================
@auth_bp.route("/register", methods=["POST"])
def register():
    try:

        college_id = (request.form.get("college_id") or "").strip().upper()
        name = (request.form.get("name") or "").strip()
        email = (request.form.get("email") or "").strip()
        password = request.form.get("password")
        role = (request.form.get("role") or "").strip().lower()

        department = (request.form.get("department") or "").strip().upper()
        year = request.form.get("year")
        section = (request.form.get("section") or "").strip().upper()

        image = request.files.get("profile_image")

        # ================================
        # BASIC VALIDATION
        # ================================
        if not college_id or not name or not email or not password or not role:
            return jsonify({"message": "All fields are required"}), 400

        if role not in ["student", "faculty", "hod", "security"]:
            return jsonify({"message": "Invalid role"}), 400

        # ================================
        # EMAIL DOMAIN VALIDATION
        # ================================
        domain_pattern = r'^[A-Z0-9._-]+@pace\.ac\.in$'

        if not re.match(domain_pattern, email):
            return jsonify({
                "message": "Use valid college email like 23KQ1A54G7@pace.ac.in"
            }), 400

        # ================================
        # STUDENT EMAIL STRICT FORMAT
        # ================================
        if role == "student":

            roll_pattern = r'^[0-9]{2}[A-Z]{2}[0-9][A-Z][0-9]{2}[A-Z0-9]@pace\.ac\.in$'

            if not re.match(roll_pattern, email):
                return jsonify({
                    "message": "Email must be uppercase like 23KQ1A54G7@pace.ac.in"
                }), 400

            # Email must match college ID
            expected_email = f"{college_id}@pace.ac.in"

            if email != expected_email:
                return jsonify({
                    "message": "Email must match your College ID"
                }), 400

        # ================================
        # ROLE BASED VALIDATION
        # ================================
        if role in ["student", "faculty", "hod"]:
            if not department:
                return jsonify({
                    "message": "Department is required"
                }), 400

        if role in ["student", "faculty"]:
            if not year or not section:
                return jsonify({
                    "message": "Year and Section are required"
                }), 400

            try:
                year = int(year)
            except:
                return jsonify({
                    "message": "Invalid year format"
                }), 400
        else:
            year = None
            section = None

        if role == "security":
            department = None
            year = None
            section = None

        # ================================
        # STUDENT IMAGE VALIDATION
        # ================================
        image_path = None

        if role == "student":

            if not image:
                return jsonify({
                    "message": "Student profile image is required"
                }), 400

            filename = secure_filename(college_id + ".jpg")

            image_path = os.path.join(UPLOAD_FOLDER, filename)

            image.save(image_path)

        # ================================
        # CREATE USER
        # ================================
        user = User(
            college_id=college_id,
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

        return jsonify({
            "message": "Registered successfully"
        }), 201

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

        if not data:
            return jsonify({
                "message": "Invalid JSON data"
            }), 400

        email = (data.get("email") or "").strip()
        password = data.get("password")

        if not email or not password:
            return jsonify({
                "message": "Email and password required"
            }), 400

        user = User.query.filter_by(email=email).first()

        if not user or not check_password_hash(user.password, password):
            return jsonify({
                "message": "Invalid credentials"
            }), 401

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