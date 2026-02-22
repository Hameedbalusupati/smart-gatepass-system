from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
from sqlalchemy import and_

from models import db, GatePass, User

# =================================================
# BLUEPRINT
# =================================================
gatepass_bp = Blueprint("gatepass_bp", __name__)


# =================================================
# APPLY GATEPASS (STUDENT)
# =================================================
@gatepass_bp.route("/apply", methods=["POST"])
@jwt_required()
def apply_gatepass():

    try:
        student_id = int(get_jwt_identity())
    except:
        return jsonify({
            "success": False,
            "message": "Invalid token"
        }), 401

    student = db.session.get(User, student_id)

    if not student:
        return jsonify({
            "success": False,
            "message": "User not found"
        }), 404

    if student.role != "student":
        return jsonify({
            "success": False,
            "message": "Only students can apply for gatepass"
        }), 403

    data = request.get_json(silent=True) or {}

    reason = (data.get("reason") or "").strip()
    parent_mobile = (
        data.get("parent_mobile")
        or data.get("parentMobile")
        or ""
    ).strip()

    if not reason or not parent_mobile:
        return jsonify({
            "success": False,
            "message": "Reason and parent mobile are required"
        }), 400

    # =================================================
    # ONE GATEPASS PER DAY
    # =================================================
    start_today = datetime.utcnow().replace(
        hour=0, minute=0, second=0, microsecond=0
    )
    end_today = start_today + timedelta(days=1)

    existing_today = GatePass.query.filter(
        and_(
            GatePass.student_id == student.id,
            GatePass.created_at >= start_today,
            GatePass.created_at < end_today,
            GatePass.status.in_([
                "PendingFaculty",
                "PendingHOD",
                "Approved"
            ])
        )
    ).first()

    if existing_today:
        return jsonify({
            "success": False,
            "message": "You can apply only one gatepass per day"
        }), 400

    # =================================================
    # CREATE GATEPASS
    # =================================================
    new_gp = GatePass(
        student_id=student.id,
        reason=reason,
        parent_mobile=parent_mobile,
        status="PendingFaculty",
        created_at=datetime.utcnow(),
        is_used=False,
        used_at=None,
        qr_token=None
    )

    db.session.add(new_gp)
    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Gatepass applied successfully"
    }), 201


# =================================================
# VIEW STUDENT GATEPASSES
# =================================================
@gatepass_bp.route("/my_gatepasses", methods=["GET"])
@jwt_required()
def my_gatepasses():

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
                "id": g.id,
                "reason": g.reason,
                "status": g.status,
                "parent_mobile": g.parent_mobile,
                "created_at": g.created_at.isoformat(),
                "is_used": g.is_used,
                "qr_token": (
                    g.qr_token
                    if g.status == "Approved" and not g.is_used
                    else None
                )
            }
            for g in gatepasses
        ]
    }), 200