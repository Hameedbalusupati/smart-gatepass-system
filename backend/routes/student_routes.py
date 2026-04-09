from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, date

from models import db, User, GatePass

student_bp = Blueprint("student_bp", __name__, url_prefix="/student")


# =================================================
# HELPER FUNCTION (CHECK STUDENT)
# =================================================
def get_student():
    try:
        student_id = int(get_jwt_identity())
    except:
        return None, jsonify({
            "success": False,
            "message": "Invalid token"
        }), 401

    student = db.session.get(User, student_id)

    if not student or student.role.lower() != "student":
        return None, jsonify({
            "success": False,
            "message": "Access denied"
        }), 403

    return student, None, None


# =================================================
# STUDENT PROFILE
# =================================================
@student_bp.route("/profile", methods=["GET"])
@jwt_required()
def profile():

    student, error, code = get_student()
    if error:
        return error, code

    return jsonify({
        "success": True,
        "user": {
            "name": student.name,
            "college_id": student.college_id,
            "department": student.department,
            "year": student.year,
            "section": student.section,
            "profile_image": student.get_image_url()
        }
    }), 200


# =================================================
# APPLY GATEPASS (FINAL VERSION - NO IMAGE, NO TIME)
# =================================================
@student_bp.route("/apply_gatepass", methods=["POST"])
@jwt_required()
def apply_gatepass():

    student, error, code = get_student()
    if error:
        return error, code

    # ✅ JSON DATA ONLY
    data = request.get_json()

    reason = (data.get("reason") or "").strip()
    parent_mobile = (data.get("parent_mobile") or "").strip()

    # ==============================
    # VALIDATION
    # ==============================
    if not reason or not parent_mobile:
        return jsonify({
            "success": False,
            "message": "All fields are required"
        }), 400

    if not parent_mobile.isdigit() or len(parent_mobile) != 10:
        return jsonify({
            "success": False,
            "message": "Invalid mobile number"
        }), 400

    # ==============================
    # CHECK: ONE GATEPASS PER DAY
    # ==============================
    today = date.today()

    existing_gatepass = GatePass.query.filter(
        GatePass.student_id == student.id,
        db.func.date(GatePass.created_at) == today
    ).first()

    if existing_gatepass:
        return jsonify({
            "success": False,
            "message": "You have already applied for a gatepass today"
        }), 400

    # ==============================
    # CREATE NEW GATEPASS
    # ==============================
    new_gatepass = GatePass(
        student_id=student.id,
        reason=reason,
        parent_mobile=parent_mobile,
        status="PendingFaculty",
        created_at=datetime.utcnow(),
        is_used=False
    )

    db.session.add(new_gatepass)
    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Gatepass applied successfully"
    }), 201


# =================================================
# STUDENT CURRENT GATEPASS STATUS
# =================================================
@student_bp.route("/status", methods=["GET"])
@jwt_required()
def student_status():

    student, error, code = get_student()
    if error:
        return error, code

    gp = (
        GatePass.query
        .filter(GatePass.student_id == student.id)
        .order_by(GatePass.created_at.desc())
        .first()
    )

    if not gp:
        return jsonify({
            "success": True,
            "gatepass": None
        }), 200

    return jsonify({
        "success": True,
        "gatepass": {
            "id": gp.id,
            "reason": gp.reason,
            "status": gp.status,
            "created_at": gp.created_at.isoformat(),
            "is_used": gp.is_used or False,
            "rejected_by": gp.rejected_by,
            "rejection_reason": gp.rejection_reason,
            "qr_token": gp.qr_token if gp.status == "Approved" and not gp.is_used else None
        }
    }), 200