import re
from datetime import datetime
from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token
from sqlalchemy.exc import IntegrityError

from models import db, User

auth_bp = Blueprint("auth_bp", __name__)

PACE_EMAIL_REGEX = r'^[a-zA-Z0-9._%+-]+@pace\.ac\.in$'


# =================================================
# REGISTER
# =================================================
@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json()
    if not data:
        return jsonify({"message": "Invalid JSON data"}), 400

    college_id = (data.get("college_id") or "").strip()
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").lower().strip()
    password = data.get("password")
    role = (data.get("role") or "").lower()

    department = data.get("department")
    year = data.get("year")
    section = data.get("section")

    # 🔐 Basic validation
    if not all([college_id, name, email, password, role]):
        return jsonify({"message": "All fields required"}), 400

    # 🔐 Restrict to @pace.ac.in
    if not re.match(PACE_EMAIL_REGEX, email):
        return jsonify({"message": "Only @pace.ac.in allowed"}), 403

    if role not in ["student", "faculty", "hod", "security"]:
        return jsonify({"message": "Invalid role"}), 400

    try:
        if role in ["student", "faculty"]:
            if not department or not year or not section:
                return jsonify({"message": "Department, Year and Section required"}), 400
            year = int(str(year)[0])

        elif role == "hod":
            year = None
            section = None
        else:
            department = None
            year = None
            section = None

        hashed_password = generate_password_hash(password)

        user = User(
            college_id=college_id,
            name=name,
            email=email,
            password=hashed_password,
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
        return jsonify({"message": "Email or College ID exists"}), 400


# =================================================
# LOGIN
# =================================================
@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()

    email = (data.get("email") or "").lower().strip()
    password = data.get("password")

    if not email or not password:
        return jsonify({"message": "Email & password required"}), 400

    user = User.query.filter_by(email=email).first()

    if not user:
        return jsonify({"message": "Invalid credentials"}), 401

    if user.is_locked:
        return jsonify({"message": "Account locked. Contact admin."}), 403

    if not check_password_hash(user.password, password):
        user.failed_attempts += 1

        if user.failed_attempts >= 5:
            user.is_locked = True

        db.session.commit()
        return jsonify({"message": "Invalid credentials"}), 401

    # Reset after success
    user.failed_attempts = 0
    user.last_login = datetime.utcnow()
    db.session.commit()

    access_token = create_access_token(
        identity=user.id,
        additional_claims={
            "role": user.role,
            "college_id": user.college_id
        }
    )

    return jsonify({
        "access_token": access_token,
        "role": user.role,
        "name": user.name,
        "id": user.id
    }), 200