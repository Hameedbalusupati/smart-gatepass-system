from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, User, GatePass

student_bp = Blueprint("student_bp", __name__)


# =================================================
# STUDENT PROFILE
# =================================================
@student_bp.route("/profile", methods=["GET"])
@jwt_required()
def profile():

    try:
        student_id = int(get_jwt_identity())
    except:
        return jsonify({
            "success": False,
            "message": "Invalid token"
        }), 401

    student = db.session.get(User, student_id)

    if not student or student.role != "student":
        return jsonify({
            "success": False,
            "message": "Access denied"
        }), 403

    return jsonify({
        "success": True,
        "user": {
            "name": student.name,
            "college_id": student.college_id,
            "department": student.department,
            "year": student.year,
            "section": student.section
        }
    }), 200


# =================================================
# STUDENT GATEPASS STATUS / HISTORY
# =================================================
@student_bp.route("/status", methods=["GET"])
@jwt_required()
def student_status():

    try:
        student_id = int(get_jwt_identity())
    except:
        return jsonify({
            "success": False,
            "message": "Invalid token"
        }), 401

    student = db.session.get(User, student_id)

    if not student or student.role != "student":
        return jsonify({
            "success": False,
            "message": "Access denied"
        }), 403

    gatepasses = (
        GatePass.query
        .filter(GatePass.student_id == student.id)
        .order_by(GatePass.created_at.desc())
        .all()
    )

    return jsonify({
        "success": True,
        "gatepasses": [
            {
                "id": gp.id,
                "reason": gp.reason,
                "status": gp.status,
                "created_at": gp.created_at.isoformat(),
                "is_used": gp.is_used,

                # ✅ QR visible ONLY if:
                # 1. HOD approved (status == Approved)
                # 2. QR not used
                "qr_token": (
                    gp.qr_token
                    if gp.status == "Approved" and not gp.is_used
                    else None
                )
            }
            for gp in gatepasses
        ]
    }), 200