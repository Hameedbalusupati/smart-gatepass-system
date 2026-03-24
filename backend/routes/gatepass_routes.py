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
# APPLY GATEPASS (🔥 FIXED + DAILY LIMIT)
# =================================================
@gatepass_bp.route("/apply", methods=["POST"])
@jwt_required()
def apply_gatepass():

    try:
        student_id = int(get_jwt_identity())
    except:
        return jsonify({"success": False, "message": "Invalid token"}), 401

    student = db.session.get(User, student_id)

    if not student or student.role.lower() != "student":
        return jsonify({"success": False, "message": "Only students allowed"}), 403

    data = request.get_json() or {}

    reason = (data.get("reason") or "").strip()
    parent_mobile = (data.get("parent_mobile") or "").strip()

    if not reason:
        return jsonify({"success": False, "message": "Reason required"}), 400

    if not re.fullmatch(r"\d{10}", parent_mobile):
        return jsonify({"success": False, "message": "Invalid mobile number"}), 400

    # =================================================
    # 🚫 ONE GATEPASS PER DAY CHECK
    # =================================================
    today = date.today()

    existing = GatePass.query.filter(
        GatePass.student_id == student.id,
        db.func.date(GatePass.created_at) == today
    ).first()

    if existing:
        return jsonify({
            "success": False,
            "message": "You already applied for a gatepass today"
        }), 400

    # =================================================
    # CREATE GATEPASS
    # =================================================
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

    return jsonify({"success": True, "message": "Gatepass applied"}), 201


# =================================================
# FACULTY ACTION (🔥 FIXED JSON)
# =================================================
@gatepass_bp.route("/faculty_action/<int:id>", methods=["POST"])
@jwt_required()
def faculty_action(id):

    faculty = db.session.get(User, int(get_jwt_identity()))

    if not faculty or faculty.role.lower() != "faculty":
        return jsonify({"success": False, "message": "Only faculty allowed"}), 403

    gp = db.session.get(GatePass, id)

    if not gp or gp.status != "PendingFaculty":
        return jsonify({"success": False, "message": "Invalid gatepass"}), 400

    data = request.get_json() or {}
    action = data.get("action")
    rejection_reason = data.get("rejection_reason")

    gp.faculty_id = faculty.id

    if action == "approve":
        gp.status = "PendingHOD"

    elif action == "reject":
        if not rejection_reason:
            return jsonify({"success": False, "message": "Reason required"}), 400

        gp.status = "Rejected"
        gp.rejected_by = "Faculty"
        gp.rejection_reason = rejection_reason

    else:
        return jsonify({"success": False, "message": "Invalid action"}), 400

    db.session.commit()

    return jsonify({"success": True, "message": "Updated"}), 200


# =================================================
# HOD ACTION
# =================================================
@gatepass_bp.route("/hod_action/<int:id>", methods=["POST"])
@jwt_required()
def hod_action(id):

    hod = db.session.get(User, int(get_jwt_identity()))

    if not hod or hod.role.lower() != "hod":
        return jsonify({"success": False, "message": "Only HOD allowed"}), 403

    gp = db.session.get(GatePass, id)

    if not gp or gp.status != "PendingHOD":
        return jsonify({"success": False, "message": "Invalid gatepass"}), 400

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
            return jsonify({"success": False, "message": "Reason required"}), 400

        gp.status = "Rejected"
        gp.rejected_by = "HOD"
        gp.rejection_reason = rejection_reason

    else:
        return jsonify({"success": False, "message": "Invalid action"}), 400

    db.session.commit()

    return jsonify({"success": True, "message": "Updated"}), 200


# =================================================
# VERIFY QR (🔥 SAFE VERSION)
# =================================================
@gatepass_bp.route("/verify_qr", methods=["POST"])
@jwt_required()
def verify_qr():

    data = request.get_json() or {}
    token = data.get("qr_token")

    if not token:
        return jsonify({"success": False, "message": "QR token required"}), 400

    try:
        payload = jwt.decode(token, Config.QR_SECRET_KEY, algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        return jsonify({"success": False, "message": "QR expired"}), 400
    except jwt.InvalidTokenError:
        return jsonify({"success": False, "message": "Invalid QR"}), 400

    gp = db.session.get(GatePass, payload["gatepass_id"])

    if not gp or gp.status != "Approved":
        return jsonify({"success": False, "message": "Not valid"}), 400

    student = db.session.get(User, gp.student_id)

    return jsonify({
        "success": True,
        "gatepass_id": gp.id,
        "student_name": student.name,
        "college_id": student.college_id,
        "department": student.department,
        "year": student.year,
        "section": student.section,
        "parent_mobile": gp.parent_mobile,
        "profile_image": student.profile_image
    })


# =================================================
# CONFIRM EXIT
# =================================================
@gatepass_bp.route("/confirm_exit/<int:id>", methods=["POST"])
@jwt_required()
def confirm_exit(id):

    gp = db.session.get(GatePass, id)

    if not gp or gp.is_used:
        return jsonify({"success": False, "message": "Already used"}), 400

    gp.is_used = True
    gp.out_time = datetime.utcnow()

    db.session.commit()

    return jsonify({"success": True, "message": "Exit confirmed"}), 200