from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token
from sqlalchemy.exc import IntegrityError
from werkzeug.utils import secure_filename
from sqlalchemy import func
import time

from models import db, User

auth_bp = Blueprint("auth_bp", __name__)


# =================================================
# REGISTER
# =================================================
@auth_bp.route("/register", methods=["POST", "OPTIONS"])
def register():
    if request.method == "OPTIONS":
        return jsonify({}), 200

    try:
        # ================= GET DATA =================
        college_id = (request.form.get("college_id") or "").strip().upper()
        name = (request.form.get("name") or "").strip()
        email = (request.form.get("email") or "").strip().lower()
        password = request.form.get("password")
        role = (request.form.get("role") or "").strip().lower()

        department = (request.form.get("department") or "AIDS").strip().upper()
        section = (request.form.get("section") or "C").strip().upper()
        year = request.form.get("year")

        image = request.files.get("profile_image")

        # ================= VALIDATION =================
        if not college_id or not name or not email or not password or not role:
            return jsonify({"message": "All fields are required"}), 400

        if role not in ["student", "faculty", "hod", "security"]:
            return jsonify({"message": "Invalid role"}), 400

        # Email validation
        parts = email.split("@")
        if len(parts) != 2 or parts[1] != "pace.ac.in":
            return jsonify({"message": "Use college email"}), 400

        if role == "student" and parts[0] != college_id.lower():
            return jsonify({"message": "Email must match roll number"}), 400

        # ================= YEAR FIX =================
        try:
            year = int(year) if year else 1
        except:
            return jsonify({"message": "Invalid year"}), 400

        # ================= DUPLICATE CHECK =================
        existing_user = User.query.filter(
            (func.lower(User.email) == email) |
            (func.upper(User.college_id) == college_id)
        ).first()

        if existing_user:
            return jsonify({"message": "User already exists"}), 400

        # ================= IMAGE HANDLE =================
        profile_path = None
        if image:
            filename = str(int(time.time())) + "_" + secure_filename(image.filename)
            profile_path = f"uploads/student_images/{filename}"

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
            profile_image=profile_path
        )

        db.session.add(user)
        db.session.commit()

        return jsonify({"message": "Registered successfully"}), 201

    except IntegrityError:
        db.session.rollback()
        return jsonify({"message": "User already exists"}), 400

    except Exception as e:
        db.session.rollback()
        return jsonify({"message": str(e)}), 500


# =================================================
# LOGIN
# =================================================
@auth_bp.route("/login", methods=["POST", "OPTIONS"])
def login():
    if request.method == "OPTIONS":
        return jsonify({}), 200

    try:
        data = request.get_json()

        email = (data.get("email") or "").strip().lower()
        password = data.get("password")

        if not email or not password:
            return jsonify({"message": "Email & password required"}), 400

        # Case-insensitive email search
        user = User.query.filter(func.lower(User.email) == email).first()

        if not user:
            return jsonify({"message": "User not found"}), 404

        if not check_password_hash(user.password, password):
            return jsonify({"message": "Invalid credentials"}), 401

        token = create_access_token(identity=str(user.id))

        return jsonify({
            "access_token": token,
            "role": user.role,
            "name": user.name,
            "id": user.id,
            "department": user.department,
            "profile_image": user.profile_image
        }), 200

    except Exception as e:
        return jsonify({"message": str(e)}), 500