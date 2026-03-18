from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
import jwt
import re

from models import db, GatePass, User
from config import Config

# ✅ NEW IMPORT
from utils.face_utils import compare_faces

gatepass_bp = Blueprint("gatepass_bp", __name__)

QR_ALGORITHM = "HS256"


# =================================================
# APPLY GATEPASS (ONLY ONE PER DAY)
# =================================================
@gatepass_bp.route("/apply", methods=["POST"])
@jwt_required()
def apply_gatepass():

    student_id = int(get_jwt_identity())
    student = db.session.get(User, student_id)

    if not student or student.role != "student":
        return jsonify({
            "success": False,
            "message": "Only students can apply"
        }), 403

    data = request.get_json() or {}

    reason = (data.get("reason") or "").strip()
    parent_mobile = (data.get("parent_mobile") or "").strip()

    if not reason:
        return jsonify({"success": False, "message": "Reason is required"}), 400

    if not parent_mobile:
        return jsonify({"success": False, "message": "Parent mobile number is required"}), 400

    if not re.fullmatch(r"\d{10}", parent_mobile):
        return jsonify({"success": False, "message": "Parent mobile must be exactly 10 digits"}), 400

    today = datetime.utcnow().date()

    today_gatepass = GatePass.query.filter(
        GatePass.student_id == student.id,
        db.func.date(GatePass.created_at) == today
    ).first()

    if today_gatepass:
        return jsonify({
            "success": False,
            "message": "You can apply only one gatepass per day"
        }), 400

    active = GatePass.query.filter(
        GatePass.student_id == student.id,
        GatePass.status.in_(["PendingFaculty", "PendingHOD", "Approved"]),
        GatePass.is_used == False
    ).first()

    if active:
        return jsonify({
            "success": False,
            "message": "You already have an active gatepass"
        }), 400

    new_gp = GatePass(
        student_id=student.id,
        reason=reason,
        parent_mobile=parent_mobile,
        status="PendingFaculty",
        created_at=datetime.utcnow(),
        is_used=False
    )

    db.session.add(new_gp)
    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Gatepass applied successfully"
    }), 201


# =================================================
# FACULTY ACTION (WITH FACE VERIFICATION)
# =================================================
@gatepass_bp.route("/faculty_action/<int:gatepass_id>", methods=["POST"])
@jwt_required()
def faculty_action(gatepass_id):

    faculty_id = int(get_jwt_identity())
    faculty = db.session.get(User, faculty_id)

    if not faculty or faculty.role != "faculty":
        return jsonify({
            "success": False,
            "message": "Only faculty can perform this action"
        }), 403

    gatepass = db.session.get(GatePass, gatepass_id)

    if not gatepass or gatepass.status != "PendingFaculty":
        return jsonify({
            "success": False,
            "message": "Invalid gatepass"
        }), 400

    # =================================================
    # ✅ FACE VERIFICATION (ONLY FOR APPROVE)
    # =================================================
    action = request.form.get("action")
    rejection_reason = (request.form.get("rejection_reason") or "").strip()

    if action == "approve":

        # Check face registered
        if not faculty.face_encoding:
            return jsonify({
                "success": False,
                "message": "Faculty face not registered"
            }), 400

        file = request.files.get("image")

        if not file:
            return jsonify({
                "success": False,
                "message": "Face image required"
            }), 400

        is_match = compare_faces(faculty.face_encoding, file)

        if not is_match:
            return jsonify({
                "success": False,
                "message": "Face not matched"
            }), 401

        # ✅ APPROVE
        gatepass.status = "PendingHOD"

    elif action == "reject":

        if not rejection_reason:
            return jsonify({
                "success": False,
                "message": "Rejection reason required"
            }), 400

        gatepass.status = "Rejected"
        gatepass.rejected_by = "Faculty"
        gatepass.rejection_reason = rejection_reason

    else:
        return jsonify({
            "success": False,
            "message": "Invalid action"
        }), 400

    gatepass.faculty_id = faculty.id

    db.session.commit()

    return jsonify({
        "success": True,
        "message": f"Gatepass {action}d successfully"
    })


# =================================================
# HOD ACTION
# =================================================
@gatepass_bp.route("/hod_action/<int:gatepass_id>", methods=["POST"])
@jwt_required()
def hod_action(gatepass_id):

    hod_id = int(get_jwt_identity())
    hod = db.session.get(User, hod_id)

    if not hod or hod.role != "hod":
        return jsonify({
            "success": False,
            "message": "Only HOD can perform this action"
        }), 403

    data = request.get_json() or {}
    action = data.get("action")
    rejection_reason = (data.get("rejection_reason") or "").strip()

    gatepass = db.session.get(GatePass, gatepass_id)

    if not gatepass or gatepass.status != "PendingHOD":
        return jsonify({
            "success": False,
            "message": "Invalid gatepass"
        }), 400

    gatepass.hod_id = hod.id

    if action == "approve":

        gatepass.status = "Approved"

        qr_payload = {
            "gatepass_id": gatepass.id,
            "exp": datetime.utcnow() + timedelta(hours=6)
        }

        gatepass.qr_token = jwt.encode(
            qr_payload,
            Config.QR_SECRET_KEY,
            algorithm=QR_ALGORITHM
        )

    elif action == "reject":

        if not rejection_reason:
            return jsonify({
                "success": False,
                "message": "Rejection reason required"
            }), 400

        gatepass.status = "Rejected"
        gatepass.rejected_by = "HOD"
        gatepass.rejection_reason = rejection_reason

    else:
        return jsonify({
            "success": False,
            "message": "Invalid action"
        }), 400

    db.session.commit()

    return jsonify({
        "success": True,
        "message": f"Gatepass {action}d successfully"
    })