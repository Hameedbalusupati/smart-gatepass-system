from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, date
import re

from models import db, User, GatePass
from sqlalchemy import func

student_bp = Blueprint("student_bp", __name__, url_prefix="/student")


# ================= HELPER =================
def clean_phone(p):
    return str(p).strip().replace(" ", "").replace("-", "")


# =================================================
# CHECK STUDENT
# =================================================
def get_student():
    try:
        student_id = int(get_jwt_identity())
    except:
        return None, jsonify({"success": False, "message": "Invalid token"}), 401

    student = db.session.get(User, student_id)

    if not student or student.role.lower() != "student":
        return None, jsonify({"success": False, "message": "Access denied"}), 403

    return student, None, None


# =================================================
# PROFILE
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
                "parent_mobile": student.parent_mobile or "",
                "profile_image": student.profile_image
            }
        }), 200

    except Exception as e:
        print("PROFILE ERROR:", e)
        return jsonify({"success": False, "message": "Server error"}), 500


# =================================================
# APPLY GATEPASS (🔥 FINAL FIXED)
# =================================================
@student_bp.route("/apply_gatepass", methods=["POST"])
@jwt_required()
def apply_gatepass():
    try:
        student, error, code = get_student()
        if error:
            return error, code

        # 🔥 IMAGE CHECK (IMPORTANT)
        if not student.profile_image:
            return jsonify({
                "success": False,
                "message": "Please upload profile image first"
            }), 403

        data = request.get_json(silent=True) or {}

        reason = (data.get("reason") or "").strip()
        input_phone = (data.get("parent_mobile") or "").strip()

        if not reason or not input_phone:
            return jsonify({
                "success": False,
                "message": "Reason and parent number required"
            }), 400

        # ================= PHONE FORMAT =================
        if not re.fullmatch(r"\d{10}", input_phone):
            return jsonify({
                "success": False,
                "message": "Invalid mobile number"
            }), 400

        # ================= DB CHECK =================
        if not student.parent_mobile:
            return jsonify({
                "success": False,
                "message": "Parent number not found in DB"
            }), 400

        # 🔥 MAIN MATCH LOGIC
        if clean_phone(input_phone) != clean_phone(student.parent_mobile):
            return jsonify({
                "success": False,
                "message": "Parent mobile number does not match our records"
            }), 400

        # ================= PREVENT MULTIPLE =================
        today = date.today()

        existing = GatePass.query.filter(
            GatePass.student_id == student.id,
            func.date(GatePass.created_at) == today
        ).first()

        if existing:
            return jsonify({
                "success": False,
                "message": "Already applied today"
            }), 400

        # ================= CREATE =================
        gp = GatePass(
            student_id=student.id,
            reason=reason,
            parent_mobile=input_phone,   # 🔥 use entered number after validation
            status="PendingFaculty",
            created_at=datetime.utcnow()
        )

        db.session.add(gp)
        db.session.commit()

        return jsonify({
            "success": True,
            "message": "Gatepass applied successfully"
        }), 201

    except Exception as e:
        print("APPLY ERROR:", e)
        return jsonify({
            "success": False,
            "message": "Server error"
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
            return jsonify({"success": True, "gatepass": None}), 200

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