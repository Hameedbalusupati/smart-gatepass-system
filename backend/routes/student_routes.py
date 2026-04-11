from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, date
from models import db, User, GatePass
from sqlalchemy import func

student_bp = Blueprint("student_bp", __name__, url_prefix="/student")


# =================================================
# HELPER FUNCTION
# =================================================
def get_student():
    try:
        student_id = int(get_jwt_identity())
        print("🔥 LOGGED IN STUDENT ID:", student_id)  # DEBUG
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

    print("🔥 STUDENT:", student.name, student.parent_mobile)  # DEBUG

    return student, None, None


# =================================================
# PROFILE API
# =================================================
@student_bp.route("/profile", methods=["GET"])
@jwt_required()
def profile():
    try:
        student, error, code = get_student()
        if error:
            return error, code

        base_url = request.host_url.rstrip("/")

        return jsonify({
            "success": True,
            "user": {
                "name": student.name or "",
                "college_id": student.college_id or "",
                "department": student.department or "",
                "year": student.year or "",
                "section": student.section or "",
                "parent_mobile": student.parent_mobile or "Not Available",  # 🔥 SAFE
                "profile_image": student.get_image_url(base_url)
            }
        }), 200

    except Exception as e:
        print("PROFILE ERROR:", e)
        return jsonify({
            "success": False,
            "message": "Server error"
        }), 500


# =================================================
# APPLY GATEPASS
# =================================================
@student_bp.route("/apply_gatepass", methods=["POST"])
@jwt_required()
def apply_gatepass():
    try:
        student, error, code = get_student()
        if error:
            return error, code

        data = request.get_json() or {}
        reason = data.get("reason")

        if not reason or not reason.strip():
            return jsonify({
                "success": False,
                "message": "Reason is required"
            }), 400

        # 🔥 AUTO FETCH FROM DB
        parent_mobile = student.parent_mobile

        print("🔥 USING PARENT MOBILE:", parent_mobile)  # DEBUG

        # ❌ REMOVE HARD ERROR (IMPORTANT FIX)
        if not parent_mobile:
            parent_mobile = "Not Available"

        today = date.today()

        existing_gatepass = GatePass.query.filter(
            GatePass.student_id == student.id,
            func.date(GatePass.created_at) == today
        ).first()

        if existing_gatepass:
            return jsonify({
                "success": False,
                "message": "You already applied for today"
            }), 400

        new_gatepass = GatePass(
            student_id=student.id,
            reason=reason.strip(),
            parent_mobile=parent_mobile,
            status="PendingFaculty",
            created_at=datetime.utcnow()
        )

        db.session.add(new_gatepass)
        db.session.commit()

        return jsonify({
            "success": True,
            "message": "Gatepass applied successfully"
        }), 201

    except Exception as e:
        print("🔥 APPLY ERROR:", e)
        return jsonify({
            "success": False,
            "message": "Internal server error"
        }), 500


# =================================================
# STATUS
# =================================================
@student_bp.route("/status", methods=["GET"])
@jwt_required()
def student_status():
    try:
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

    except Exception as e:
        print("STATUS ERROR:", e)
        return jsonify({
            "success": False,
            "message": "Server error"
        }), 500