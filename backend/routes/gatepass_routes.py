from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, date
import re

from models import db, GatePass, User
from sqlalchemy import func

from utils.cloudinary_config import upload_image

gatepass_bp = Blueprint("gatepass_bp", __name__)


# ================= HELPER =================
def clean_phone(p):
    return str(p).strip().replace(" ", "").replace("-", "")


# =================================================
# APPLY GATEPASS
# =================================================
@gatepass_bp.route("/apply", methods=["POST"])
@jwt_required()
def apply_gatepass():
    try:
        student_id = int(get_jwt_identity())
        student = db.session.get(User, student_id)

        if not student or student.role.lower() != "student":
            return jsonify({"success": False, "message": "Only students allowed"}), 403

        # ================= GET INPUT =================
        reason = (request.form.get("reason") or "").strip()
        input_phone = (request.form.get("parent_mobile") or "").strip()

        if not reason or not input_phone:
            return jsonify({"success": False, "message": "All fields required"}), 400

        # ================= PHONE FORMAT VALIDATION =================
        if not re.fullmatch(r"\d{10}", input_phone):
            return jsonify({"success": False, "message": "Invalid mobile number"}), 400

        # ================= DB CHECK =================
        if not student.parent_mobile:
            return jsonify({"success": False, "message": "Parent number not available in DB"}), 400

        # 🔥 MAIN MATCH LOGIC
        if clean_phone(input_phone) != clean_phone(student.parent_mobile):
            return jsonify({
                "success": False,
                "message": "Parent mobile number does not match our records"
            }), 400

        # ================= PREVENT MULTIPLE REQUESTS =================
        today = date.today()

        existing = GatePass.query.filter(
            GatePass.student_id == student.id,
            func.date(GatePass.created_at) == today
        ).first()

        if existing:
            return jsonify({"success": False, "message": "Already applied today"}), 400

        # ================= IMAGE UPLOAD =================
        file = request.files.get("image")
        image_url = None

        if file:
            try:
                image_url = upload_image(file)
            except Exception as e:
                print("IMAGE ERROR:", e)

        # ================= CREATE GATEPASS =================
        gp = GatePass(
            student_id=student.id,
            reason=reason,
            parent_mobile=input_phone,   # 🔥 FIXED (use entered number after validation)
            image=image_url,
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
        return jsonify({"success": False, "message": "Server error"}), 500


# =================================================
# MY GATEPASS
# =================================================
@gatepass_bp.route("/my_gatepass", methods=["GET"])
@jwt_required()
def my_gatepass():
    try:
        student_id = int(get_jwt_identity())

        gp = GatePass.query.filter(
            GatePass.student_id == student_id
        ).order_by(GatePass.created_at.desc()).first()

        if not gp:
            return jsonify({"success": False, "message": "No gatepass found"}), 404

        return jsonify({
            "success": True,
            "gatepass": {
                "id": gp.id,
                "reason": gp.reason,
                "status": gp.status,
                "created_at": gp.created_at.isoformat(),
                "is_used": gp.is_used or False,
                "image": gp.image,
                "qr_token": gp.qr_token if gp.status == "Approved" and not gp.is_used else None
            }
        })

    except Exception as e:
        print("MY GP ERROR:", e)
        return jsonify({"success": False, "message": "Server error"}), 500


# =================================================
# FACULTY PENDING
# =================================================
@gatepass_bp.route("/faculty/gatepasses/pending", methods=["GET"])
@jwt_required()
def faculty_pending():
    try:
        faculty = db.session.get(User, int(get_jwt_identity()))

        if not faculty or faculty.role.lower() != "faculty":
            return jsonify({"success": False, "message": "Only faculty allowed"}), 403

        gatepasses = GatePass.query.filter_by(status="PendingFaculty") \
            .order_by(GatePass.created_at.desc()).all()

        result = []
        for g in gatepasses:
            student = db.session.get(User, g.student_id)
            if not student:
                continue

            result.append({
                "id": g.id,
                "student_name": student.name,
                "student_image": student.profile_image,
                "gatepass_image": g.image,
                "reason": g.reason,
                "parent_mobile": g.parent_mobile,
                "status": g.status,
                "date": g.created_at.strftime("%Y-%m-%d") if g.created_at else "",
                "time": g.created_at.strftime("%I:%M %p") if g.created_at else ""
            })

        return jsonify({"success": True, "gatepasses": result})

    except Exception as e:
        print("FACULTY ERROR:", e)
        return jsonify({"success": False, "message": "Server error"}), 500


# =================================================
# FACULTY HISTORY
# =================================================
@gatepass_bp.route("/faculty/gatepasses/history", methods=["GET"])
@jwt_required()
def faculty_history():
    try:
        faculty = db.session.get(User, int(get_jwt_identity()))

        if not faculty or faculty.role.lower() != "faculty":
            return jsonify({"success": False, "message": "Only faculty allowed"}), 403

        gatepasses = GatePass.query.filter(
            GatePass.status.in_(["Approved", "Rejected", "PendingHOD"])
        ).order_by(GatePass.created_at.desc()).all()

        result = []
        for g in gatepasses:
            student = db.session.get(User, g.student_id)
            if not student:
                continue

            result.append({
                "id": g.id,
                "student_name": student.name,
                "parent_mobile": g.parent_mobile,
                "status": g.status,
                "date": g.created_at.strftime("%Y-%m-%d") if g.created_at else "",
                "time": g.created_at.strftime("%I:%M %p") if g.created_at else "",
                "student_image": student.profile_image,
                "gatepass_image": g.image
            })

        return jsonify({"success": True, "gatepasses": result})

    except Exception as e:
        print("HISTORY ERROR:", e)
        return jsonify({"success": False, "message": "Server error"}), 500


# =================================================
# FACULTY ACTION
# =================================================
@gatepass_bp.route("/faculty_action/<int:id>", methods=["POST"])
@jwt_required()
def faculty_action(id):
    try:
        faculty = db.session.get(User, int(get_jwt_identity()))

        if not faculty or faculty.role.lower() != "faculty":
            return jsonify({"success": False, "message": "Only faculty allowed"}), 403

        gp = db.session.get(GatePass, id)

        if not gp or gp.status != "PendingFaculty":
            return jsonify({"success": False, "message": "Invalid gatepass"}), 400

        data = request.get_json(silent=True) or {}

        action = data.get("action")
        rejection_reason = data.get("rejection_reason")

        if not action:
            return jsonify({"success": False, "message": "Action required"}), 400

        gp.faculty_id = faculty.id

        if action == "approve":
            gp.status = "PendingHOD"
            gp.faculty_approved_at = datetime.utcnow()

        elif action == "reject":
            if not rejection_reason:
                return jsonify({"success": False, "message": "Reason required"}), 400

            gp.status = "Rejected"
            gp.rejected_by = "Faculty"
            gp.rejection_reason = rejection_reason

        else:
            return jsonify({"success": False, "message": "Invalid action"}), 400

        db.session.commit()

        return jsonify({"success": True, "message": "Updated successfully"})

    except Exception as e:
        print("ACTION ERROR:", e)
        return jsonify({"success": False, "message": "Server error"}), 500