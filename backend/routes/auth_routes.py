from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token
from sqlalchemy.exc import IntegrityError

from models import db, User

# Blueprint (NO url_prefix here – added in app.py)
auth_bp = Blueprint("auth_bp", __name__)

# =================================================
# REGISTER
# =================================================
@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json()

    if not data:
        return jsonify({"message": "Invalid JSON data"}), 400

    # Common fields
    college_id = (data.get("college_id") or "").strip()
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").lower().strip()
    password = data.get("password")
    role = (data.get("role") or "").lower()

    # Optional / role-based fields
    department = data.get("department")
    year = data.get("year")
    section = data.get("section")

    # Basic validation
    if not college_id or not name or not email or not password or not role:
        return jsonify({"message": "All fields are required"}), 400

    if role not in ["student", "faculty", "hod", "security"]:
        return jsonify({"message": "Invalid role"}), 400

    try:
        # -------------------------------------------------
        # ROLE-BASED VALIDATION
        # -------------------------------------------------
        if role in ["student", "faculty"]:
            if not department or not year or not section:
                return jsonify({
                    "message": "Department, Year and Section are required"
                }), 400

            # FIX: Convert "3rd" → 3 safely
            try:
                year = int(str(year)[0])
            except Exception:
                return jsonify({"message": "Invalid year format"}), 400

        elif role == "hod":
            year = None
            section = None

        else:  # security
            department = None
            year = None
            section = None

        # -------------------------------------------------
        # CREATE USER
        # -------------------------------------------------
        user = User(
            college_id=college_id,
            name=name,
            email=email,
            password=generate_password_hash(password),
            role=role,
            department=department,
            year=year,
            section=section
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
            "message": "Internal server error",
            "error": str(e)
        }), 500


# =================================================
# LOGIN
# =================================================
@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()

    if not data:
        return jsonify({"message": "Invalid JSON data"}), 400

    email = (data.get("email") or "").lower().strip()
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