from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta, date
import jwt
import re

from models import db, GatePass, User
from config import Config

gatepass_bp = Blueprint("gatepass_bp", __name__)

QR_ALGORITHM = "HS256"


# =================================================
# APPLY GATEPASS
# =================================================
@gatepass_bp.route("/apply", methods=["POST"])
@jwt_required()
def apply_gatepass():
    try:
        student_id = int(get_jwt_identity())
    except:
        return jsonify({"message": "Invalid token"}), 401

    student = db.session.get(User, student_id)

    if not student or student.role.lower() != "student":
        return jsonify({"message": "Only students allowed"}), 403

    data = request.get_json() or {}

    reason = (data.get("reason") or "").strip()
    parent_mobile = (data.get("parent_mobile") or "").strip()

    if not reason:
        return jsonify({"message": "Reason required"}), 400

    if not re.fullmatch(r"\d{10}", parent_mobile):
        return jsonify({"message": "Invalid mobile number"}), 400

    today = date.today()

    existing = GatePass.query.filter(
        GatePass.student_id == student.id,
        db.func.date(GatePass.created_at) == today
    ).first()

    if existing:
        return jsonify({"message": "Already applied today"}), 400

    gp = GatePass(
        student_id=student.id,
        reason=reason,
        parent_mobile=parent_mobile,
        status="PendingFaculty",
        created_at=datetime.utcnow(),
        is_used=False
    )

    db.session.add(gp)
    db.session.commit()

    return jsonify({"message": "Gatepass applied"}), 201


# =================================================
# ✅ FACULTY PENDING (🔥 FIX ADDED)
# =================================================
@gatepass_bp.route("/faculty/gatepasses/pending", methods=["GET"])
@jwt_required()
def faculty_pending():

    gatepasses = GatePass.query.filter_by(status="PendingFaculty").all()

    result = []

    for g in gatepasses:
        student = db.session.get(User, g.student_id)

        result.append({
            "id": g.id,
            "student_name": student.name,
            "reason": g.reason,
            "parent_mobile": g.parent_mobile,   # ✅ FIX
            "status": g.status
        })

    return jsonify({"gatepasses": result})


# =================================================
# ✅ FACULTY HISTORY (🔥 FIX ADDED)
# =================================================
@gatepass_bp.route("/faculty/gatepasses/history", methods=["GET"])
@jwt_required()
def faculty_history():

    gatepasses = GatePass.query.filter(
        GatePass.status != "PendingFaculty"
    ).all()

    result = []

    for g in gatepasses:
        student = db.session.get(User, g.student_id)

        result.append({
            "id": g.id,
            "student_name": student.name,
            "parent_mobile": g.parent_mobile,   # ✅ FIX
            "status": g.status
        })

    return jsonify({"gatepasses": result})


# =================================================
# FACULTY ACTION
# =================================================
@gatepass_bp.route("/faculty_action/<int:id>", methods=["POST"])
@jwt_required()
def faculty_action(id):

    faculty = db.session.get(User, int(get_jwt_identity()))

    if not faculty or faculty.role.lower() != "faculty":
        return jsonify({"message": "Only faculty allowed"}), 403

    gp = db.session.get(GatePass, id)

    if not gp or gp.status != "PendingFaculty":
        return jsonify({"message": "Invalid gatepass"}), 400

    data = request.get_json() or {}

    action = data.get("action")
    rejection_reason = data.get("rejection_reason")

    gp.faculty_id = faculty.id

    if action == "approve":
        gp.status = "PendingHOD"

    elif action == "reject":
        if not rejection_reason:
            return jsonify({"message": "Reason required"}), 400

        gp.status = "Rejected"
        gp.rejected_by = "Faculty"
        gp.rejection_reason = rejection_reason

    else:
        return jsonify({"message": "Invalid action"}), 400

    db.session.commit()

    return jsonify({"message": "Updated"})


# =================================================
# HOD ACTION
# =================================================
@gatepass_bp.route("/hod_action/<int:id>", methods=["POST"])
@jwt_required()
def hod_action(id):

    hod = db.session.get(User, int(get_jwt_identity()))

    if not hod or hod.role.lower() != "hod":
        return jsonify({"message": "Only HOD allowed"}), 403

    gp = db.session.get(GatePass, id)

    if not gp or gp.status != "PendingHOD":
        return jsonify({"message": "Invalid gatepass"}), 400

    data = request.get_json() or {}

    action = data.get("action")
    rejection_reason = data.get("rejection_reason")

    gp.hod_id = hod.id

    if action == "approve":
        gp.status = "Approved"

        qr_payload = {
            "gatepass_id": gp.id,
            "exp": datetime.utcnow() + timedelta(hours=6)
        }

        gp.qr_token = jwt.encode(
            qr_payload,
            Config.QR_SECRET_KEY,
            algorithm=QR_ALGORITHM
        )

    elif action == "reject":
        if not rejection_reason:
            return jsonify({"message": "Reason required"}), 400

        gp.status = "Rejected"
        gp.rejected_by = "HOD"
        gp.rejection_reason = rejection_reason

    else:
        return jsonify({"message": "Invalid action"}), 400

    db.session.commit()

    return jsonify({"message": "Updated"})