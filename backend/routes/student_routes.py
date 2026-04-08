from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, date
import re

from models import db, User, GatePass

student_bp = Blueprint("student_bp", __name__, url_prefix="/student")


# =================================================
# HELPER FUNCTION (CHECK STUDENT)
# =================================================
def get_student():
    try:
        student_id = int(get_jwt_identity())
    except Exception:
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
    try:
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
                "parent_number": student.parent_number
            }
        }), 200

    except Exception as e:
        print("PROFILE ERROR:", e)
        return jsonify({
            "success": False,
            "message": "Server error"
        }), 500


# =================================================
# APPLY GATEPASS (FINAL FIXED)
# =================================================
@student_bp.route("/apply_gatepass", methods=["POST"])
@jwt_required()
def apply_gatepass():
    try:
        student, error, code = get_student()
        if error:
            return error, code

        data = request.get_json() or {}

        print("DEBUG REQUEST:", data)  # 🔥 debug log

        reason = (data.get("reason") or "").strip()
        entered_mobile = (data.get("parent_mobile") or "").strip()

        # ================= VALIDATION =================
        if not reason or not entered_mobile:
            return jsonify({
                "success": False,
                "message": "All fields are required"
            }), 400

        # ✅ Mobile format check
        if not re.fullmatch(r"\d{10}", entered_mobile):
            return jsonify({
                "success": False,
                "message": "Enter valid 10-digit mobile number"
            }), 400

        # ✅ Normalize DB value
        db_mobile = (student.parent_number or "").strip()

        if not db_mobile:
            return jsonify({
                "success": False,
                "message": "Parent number not found. Contact admin"
            }), 400

        # ✅ Compare numbers
        if db_mobile != entered_mobile:
            return jsonify({
                "success": False,
                "message": "Parent mobile number is incorrect"
            }), 400

        # ================= ONE PER DAY =================
        today = date.today()

        existing_gatepass = GatePass.query.filter(
            GatePass.student_id == student.id,
            db.func.date(GatePass.created_at) == today
        ).first()

        if existing_gatepass:
            return jsonify({
                "success": False,
                "message": "You already applied for a gatepass today"
            }), 400

        # ================= CREATE =================
        new_gatepass = GatePass(
            student_id=student.id,
            reason=reason,
            parent_mobile=db_mobile,
            out_time=datetime.utcnow(),
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

    except Exception as e:
        print("APPLY ERROR:", e)
        return jsonify({
            "success": False,
            "message": "Server error"
        }), 500


# =================================================
# STUDENT CURRENT GATEPASS STATUS
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
                "out_time": gp.out_time.isoformat() if gp.out_time else None,
                "is_used": gp.is_used or False,
                "parent_mobile": gp.parent_mobile,
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