from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
import jwt
import re

from models import db, GatePass, User
from config import Config

gatepass_bp = Blueprint("gatepass_bp", __name__)

QR_ALGORITHM = "HS256"


# =================================================
# APPLY GATEPASS (STUDENT)
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

    # Validation
    if not reason:
        return jsonify({"success": False, "message": "Reason is required"}), 400

    if not re.fullmatch(r"\d{10}", parent_mobile):
        return jsonify({"success": False, "message": "Invalid mobile number"}), 400

    today = datetime.utcnow().date()

    # One gatepass per day
    today_gp = GatePass.query.filter(
        GatePass.student_id == student.id,
        db.func.date(GatePass.created_at) == today
    ).first()

    if today_gp:
        return jsonify({"success": False, "message": "Only one gatepass per day"}), 400

    # Active gatepass check
    active = GatePass.query.filter(
        GatePass.student_id == student.id,
        GatePass.status.in_(["PendingFaculty", "PendingHOD", "Approved"]),
        GatePass.is_used == False
    ).first()

    if active:
        return jsonify({"success": False, "message": "Active gatepass exists"}), 400

    # Create gatepass
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

    return jsonify({"success": True, "message": "Applied successfully"}), 201


# =================================================
# FACULTY ACTION
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

    gatepass = db.session.get(GatePass, gatepass_id)

    if not gatepass or gatepass.status != "PendingFaculty":
        return jsonify({"success": False, "message": "Invalid gatepass"}), 400

    gatepass.faculty_id = faculty.id

    # APPROVE
    if action == "approve":
        gatepass.status = "PendingHOD"

    # REJECT
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

    # APPROVE
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

    # REJECT
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


# =================================================
# FACULTY GET PENDING
# =================================================
@gatepass_bp.route("/faculty/gatepasses/pending", methods=["GET"])
@jwt_required()
def faculty_pending():

    faculty_id = int(get_jwt_identity())
    faculty = db.session.get(User, faculty_id)

    if not faculty or faculty.role != "faculty":
        return jsonify({"success": False}), 403

    gatepasses = GatePass.query.filter_by(status="PendingFaculty").all()

    data = []
    for gp in gatepasses:
        student = db.session.get(User, gp.student_id)

        data.append({
            "id": gp.id,
            "student_name": student.name,
            "reason": gp.reason,
            "parent_mobile": gp.parent_mobile   # ✅ INCLUDED
        })

    return jsonify({"success": True, "gatepasses": data})


# =================================================
# FACULTY HISTORY
# =================================================
@gatepass_bp.route("/faculty/gatepasses/history", methods=["GET"])
@jwt_required()
def faculty_history():

    faculty_id = int(get_jwt_identity())
    faculty = db.session.get(User, faculty_id)

    if not faculty or faculty.role != "faculty":
        return jsonify({"success": False}), 403

    gatepasses = GatePass.query.filter_by(faculty_id=faculty.id).all()

    data = []
    for gp in gatepasses:
        student = db.session.get(User, gp.student_id)

        data.append({
            "id": gp.id,
            "student_name": student.name,
            "status": gp.status,
            "parent_mobile": gp.parent_mobile   # ✅ INCLUDED
        })

    return jsonify({"success": True, "gatepasses": data})


# =================================================
# HOD PENDING
# =================================================
@gatepass_bp.route("/hod/gatepasses/pending", methods=["GET"])
@jwt_required()
def hod_pending():

    gatepasses = GatePass.query.filter_by(status="PendingHOD").all()

    data = []
    for gp in gatepasses:
        student = db.session.get(User, gp.student_id)

        data.append({
            "id": gp.id,
            "student_name": student.name,
            "college_id": student.college_id,
            "department": student.department,
            "year": student.year,
            "section": student.section,
            "reason": gp.reason,
            "parent_mobile": gp.parent_mobile   # ✅ INCLUDED
        })

    return jsonify({"success": True, "gatepasses": data})


# =================================================
# HOD HISTORY
# =================================================
@gatepass_bp.route("/hod/gatepasses/history", methods=["GET"])
@jwt_required()
def hod_history():

    gatepasses = GatePass.query.filter(
        GatePass.status.in_(["Approved", "Rejected"])
    ).all()

    data = []
    for gp in gatepasses:
        student = db.session.get(User, gp.student_id)

        data.append({
            "id": gp.id,
            "student_name": student.name,
            "reason": gp.reason,
            "status": gp.status,
            "parent_mobile": gp.parent_mobile   # ✅ INCLUDED
        })

    return jsonify({"success": True, "gatepasses": data})