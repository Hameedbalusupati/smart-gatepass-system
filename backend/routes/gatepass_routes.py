from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
import jwt
import re
import os

from models import db, GatePass, User
from config import Config

# ✅ FIXED IMPORT (important for Render)
from backend.utils.face_utils import compare_faces

gatepass_bp = Blueprint("gatepass_bp", __name__)

QR_ALGORITHM = "HS256"


# =================================================
# APPLY GATEPASS
# =================================================
@gatepass_bp.route("/apply", methods=["POST"])
@jwt_required()
def apply_gatepass():

    student_id = int(get_jwt_identity())
    student = db.session.get(User, student_id)

    if not student or student.role != "student":
        return jsonify({"success": False, "message": "Only students can apply"}), 403

    data = request.get_json() or {}

    reason = (data.get("reason") or "").strip()
    parent_mobile = (data.get("parent_mobile") or "").strip()

    if not reason:
        return jsonify({"success": False, "message": "Reason is required"}), 400

    if not re.fullmatch(r"\d{10}", parent_mobile):
        return jsonify({"success": False, "message": "Invalid mobile number"}), 400

    today = datetime.utcnow().date()

    today_gatepass = GatePass.query.filter(
        GatePass.student_id == student.id,
        db.func.date(GatePass.created_at) == today
    ).first()

    if today_gatepass:
        return jsonify({"success": False, "message": "Only one gatepass per day"}), 400

    active = GatePass.query.filter(
        GatePass.student_id == student.id,
        GatePass.status.in_(["PendingFaculty", "PendingHOD", "Approved"]),
        GatePass.is_used == False
    ).first()

    if active:
        return jsonify({"success": False, "message": "Active gatepass exists"}), 400

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

    return jsonify({"success": True, "message": "Applied successfully"}), 201


# =================================================
# FACULTY ACTION (FIXED FACE MATCH)
# =================================================
@gatepass_bp.route("/faculty_action/<int:gatepass_id>", methods=["POST"])
@jwt_required()
def faculty_action(gatepass_id):

    faculty_id = int(get_jwt_identity())
    faculty = db.session.get(User, faculty_id)

    if not faculty or faculty.role != "faculty":
        return jsonify({"success": False, "message": "Only faculty allowed"}), 403

    action = request.form.get("action")
    rejection_reason = (request.form.get("rejection_reason") or "").strip()
    live_image = request.files.get("live_image")

    gatepass = db.session.get(GatePass, gatepass_id)

    if not gatepass or gatepass.status != "PendingFaculty":
        return jsonify({"success": False, "message": "Invalid gatepass"}), 400

    gatepass.faculty_id = faculty.id

    # =========================
    # APPROVE
    # =========================
    if action == "approve":

        if not live_image:
            return jsonify({"success": False, "message": "Live image required"}), 400

        if not faculty.face_image:
            return jsonify({"success": False, "message": "Register face first"}), 400

        # Save temp image
        os.makedirs("temp", exist_ok=True)
        live_path = f"temp/live_{gatepass.id}.jpg"
        live_image.save(live_path)

        try:
            # ✅ FIX: both must be same type
            match = compare_faces(faculty.face_image, live_path)

            if not match:
                return jsonify({
                    "success": False,
                    "message": "Face verification failed"
                }), 403

        finally:
            # ✅ DELETE TEMP FILE
            if os.path.exists(live_path):
                os.remove(live_path)

        gatepass.status = "PendingHOD"

    # =========================
    # REJECT
    # =========================
    elif action == "reject":

        if not rejection_reason:
            return jsonify({"success": False, "message": "Reason required"}), 400

        gatepass.status = "Rejected"
        gatepass.rejected_by = "Faculty"
        gatepass.rejection_reason = rejection_reason

    else:
        return jsonify({"success": False, "message": "Invalid action"}), 400

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
        return jsonify({"success": False, "message": "Only HOD allowed"}), 403

    data = request.get_json() or {}
    action = data.get("action")
    rejection_reason = (data.get("rejection_reason") or "").strip()

    gatepass = db.session.get(GatePass, gatepass_id)

    if not gatepass or gatepass.status != "PendingHOD":
        return jsonify({"success": False, "message": "Invalid gatepass"}), 400

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
            return jsonify({"success": False, "message": "Reason required"}), 400

        gatepass.status = "Rejected"
        gatepass.rejected_by = "HOD"
        gatepass.rejection_reason = rejection_reason

    else:
        return jsonify({"success": False, "message": "Invalid action"}), 400

    db.session.commit()

    return jsonify({
        "success": True,
        "message": f"Gatepass {action}d successfully"
    })