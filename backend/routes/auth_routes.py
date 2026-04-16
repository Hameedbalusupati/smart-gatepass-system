from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token
from sqlalchemy.exc import IntegrityError
from sqlalchemy import func

from models import db, User
from utils.cloudinary_config import upload_image

auth_bp = Blueprint("auth_bp", __name__)


# =================================================
# REGISTER
# =================================================
@auth_bp.route("/register", methods=["POST", "OPTIONS"])
def register():
    if request.method == "OPTIONS":
        return jsonify({}), 200

    try:
        college_id = (request.form.get("college_id") or "").strip().upper()
        name = (request.form.get("name") or "").strip()
        email = (request.form.get("email") or "").strip().lower()
        password = request.form.get("password")
        role = (request.form.get("role") or "").strip().lower()

        department = (request.form.get("department") or "AIDS").strip().upper()
        section = (request.form.get("section") or "C").strip().upper()
        year = request.form.get("year")

        file = request.files.get("profile_image")

        # VALIDATION
        if not college_id or not name or not email or not password or not role:
            return jsonify({"message": "All fields are required"}), 400

        if role not in ["student", "faculty", "hod", "security"]:
            return jsonify({"message": "Invalid role"}), 400

        # EMAIL VALIDATION
        parts = email.split("@")
        if len(parts) != 2 or parts[1] != "pace.ac.in":
            return jsonify({"message": "Use college email"}), 400

        if role == "student" and parts[0] != college_id.lower():
            return jsonify({"message": "Email must match roll number"}), 400

        # YEAR
        try:
            year = int(year) if year else 1
        except:
            return jsonify({"message": "Invalid year"}), 400

        # DUPLICATE CHECK
        existing_user = User.query.filter(
            (func.lower(User.email) == email) |
            (func.upper(User.college_id) == college_id)
        ).first()

        if existing_user:
            return jsonify({"message": "User already exists"}), 400

        # IMAGE UPLOAD
        image_url = None
        if file:
            try:
                image_url = upload_image(file)
            except Exception as e:
                print("IMAGE ERROR:", e)

        # CREATE USER
        user = User(
            college_id=college_id,
            name=name,
            email=email,
            password=generate_password_hash(password),
            role=role,
            department=department,
            year=year,
            section=section,
            profile_image=image_url
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
        return jsonify({"message": "Server error"}), 500


# =================================================
# LOGIN (🔥 FIXED VERSION)
# =================================================
@auth_bp.route("/login", methods=["POST", "OPTIONS"])
def login():
    if request.method == "OPTIONS":
        return jsonify({}), 200

    try:
        data = request.get_json(silent=True) or {}

        email = (data.get("email") or "").strip().lower()
        password = data.get("password")

        if not email or not password:
            return jsonify({"message": "Email & password required"}), 400

        # FIND USER
        user = User.query.filter(func.lower(User.email) == email).first()

        if not user:
            return jsonify({"message": "User not found"}), 404

        if not check_password_hash(user.password, password):
            return jsonify({"message": "Invalid credentials"}), 401

        # TOKEN
        token = create_access_token(identity=str(user.id))

        # IMAGE CHECK (🔥 FIXED SAFE CHECK)
        require_image = False
        if user.role == "student" and (user.profile_image is None or user.profile_image == ""):
            require_image = True

        # 🔥 IMPORTANT: CONSISTENT FIELD NAME
        return jsonify({
            "access_token": token,
            "user": {
                "id": user.id,
                "name": user.name,
                "role": user.role,
                "department": user.department,
                "profile_image": user.profile_image,   # ✅ consistent
                "require_image": require_image
            }
        }), 200

    except Exception as e:
        print("LOGIN ERROR:", e)
        return jsonify({"message": "Server error"}), 500