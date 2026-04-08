from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta, date
import jwt
import re

from models import db, GatePass, User
from config import Config

gatepass_bp = Blueprint("gatepass_bp", __name__, url_prefix="/gatepass")

QR_ALGORITHM = "HS256"


# =================================================
# APPLY GATEPASS (FINAL FIXED)
# =================================================
@gatepass_bp.route("/apply", methods=["POST"])
@jwt_required()
def apply_gatepass():
    try:
        student_id = int(get_jwt_identity())
        student = db.session.get(User, student_id)

        if not student or student.role.lower() != "student":
            return jsonify({
                "success": False,
                "message": "Only students allowed"
            }), 403

        data = request.get_json() or {}

        print("DEBUG DATA:", data)  # 🔥 DEBUG

        reason = (data.get("reason") or "").strip()
        entered_mobile = (data.get("parent_mobile") or "").strip()

        # ✅ VALIDATION
        if not reason or not entered_mobile:
            return jsonify({
                "success": False,
                "message": "All fields are required"
            }), 400

        # ✅ MOBILE FORMAT
        if not re.fullmatch(r"\d{10}", entered_mobile):
            return jsonify({
                "success": False,
                "message": "Enter valid 10-digit mobile number"
            }), 400

        # ✅ DB CHECK
        if student.parent_number != entered_mobile:
            return jsonify({
                "success": False,
                "message": "Parent mobile number is incorrect"
            }), 400

        # ✅ ONE PER DAY
        today = date.today()

        existing = GatePass.query.filter(
            GatePass.student_id == student.id,
            db.func.date(GatePass.created_at) == today
        ).first()

        if existing:
            return jsonify({
                "success": False,
                "message": "Already applied today"
            }), 400

        # ✅ CREATE
        gp = GatePass(
            student_id=student.id,
            reason=reason,
            parent_mobile=student.parent_number,
            status="PendingFaculty",
            created_at=datetime.utcnow(),
            is_used=False
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
# GET APPROVED QR
# =================================================
@gatepass_bp.route("/my_gatepass", methods=["GET"])
@jwt_required()
def my_gatepass():
    try:
        student_id = int(get_jwt_identity())

        gp = GatePass.query.filter_by(
            student_id=student_id,
            status="Approved",
            is_used=False
        ).order_by(GatePass.id.desc()).first()

        if not gp:
            return jsonify({
                "success": False,
                "message": "No approved gatepass"
            }), 404

        return jsonify({
            "success": True,
            "qr_token": gp.qr_token,
            "gatepass_id": gp.id
        }), 200

    except Exception as e:
        print("MY GP ERROR:", e)
        return jsonify({
            "success": False,
            "message": "Server error"
        }), 500


# =================================================
# FACULTY PENDING
# =================================================
@gatepass_bp.route("/faculty/pending", methods=["GET"])
@jwt_required()
def faculty_pending():
    try:
        gatepasses = GatePass.query.filter_by(status="PendingFaculty").all()

        result = []
        for g in gatepasses:
            student = db.session.get(User, g.student_id)

            result.append({
                "id": g.id,
                "student_name": student.name if student else "Unknown",
                "reason": g.reason,
                "parent_mobile": g.parent_mobile,
                "status": g.status
            })

        return jsonify({
            "success": True,
            "gatepasses": result
        }), 200

    except Exception as e:
        print("FACULTY ERROR:", e)
        return jsonify({
            "success": False,
            "message": "Server error"
        }), 500


# =================================================
# FACULTY ACTION
# =================================================
@gatepass_bp.route("/faculty_action/<int:id>", methods=["POST"])
@jwt_required()
def faculty_action(id):
    try:
        faculty = db.session.get(User, int(get_jwt_identity()))

        if not faculty or faculty.role.lower() != "faculty":
            return jsonify({
                "success": False,
                "message": "Only faculty allowed"
            }), 403

        gp = db.session.get(GatePass, id)

        if not gp or gp.status != "PendingFaculty":
            return jsonify({
                "success": False,
                "message": "Invalid gatepass"
            }), 400

        data = request.get_json() or {}
        action = data.get("action")
        rejection_reason = data.get("rejection_reason")

        gp.faculty_id = faculty.id

        if action == "approve":
            gp.status = "PendingHOD"
            gp.faculty_approved_at = datetime.utcnow()

        elif action == "reject":
            if not rejection_reason:
                return jsonify({
                    "success": False,
                    "message": "Reason required"
                }), 400

            gp.status = "Rejected"
            gp.rejected_by = "Faculty"
            gp.rejection_reason = rejection_reason

        else:
            return jsonify({
                "success": False,
                "message": "Invalid action"
            }), 400

        db.session.commit()

        return jsonify({
            "success": True,
            "message": "Updated successfully"
        }), 200

    except Exception as e:
        print("FACULTY ACTION ERROR:", e)
        return jsonify({
            "success": False,
            "message": "Server error"
        }), 500


# =================================================
# HOD ACTION
# =================================================
@gatepass_bp.route("/hod_action/<int:id>", methods=["POST"])
@jwt_required()
def hod_action(id):
    try:
        hod = db.session.get(User, int(get_jwt_identity()))

        if not hod or hod.role.lower() != "hod":
            return jsonify({
                "success": False,
                "message": "Only HOD allowed"
            }), 403

        gp = db.session.get(GatePass, id)

        if not gp or gp.status != "PendingHOD":
            return jsonify({
                "success": False,
                "message": "Invalid gatepass"
            }), 400

        data = request.get_json() or {}
        action = data.get("action")
        rejection_reason = data.get("rejection_reason")

        gp.hod_id = hod.id

        if action == "approve":
            gp.status = "Approved"
            gp.hod_approved_at = datetime.utcnow()

            qr_payload = {
                "gatepass_id": gp.id,
                "exp": datetime.utcnow() + timedelta(minutes=10)
            }

            gp.qr_token = jwt.encode(
                qr_payload,
                Config.QR_SECRET_KEY,
                algorithm=QR_ALGORITHM
            )

        elif action == "reject":
            if not rejection_reason:
                return jsonify({
                    "success": False,
                    "message": "Reason required"
                }), 400

            gp.status = "Rejected"
            gp.rejected_by = "HOD"
            gp.rejection_reason = rejection_reason

        else:
            return jsonify({
                "success": False,
                "message": "Invalid action"
            }), 400

        db.session.commit()

        return jsonify({
            "success": True,
            "message": "Updated successfully"
        }), 200

    except Exception as e:
        print("HOD ERROR:", e)
        return jsonify({
            "success": False,
            "message": "Server error"
        }), 500