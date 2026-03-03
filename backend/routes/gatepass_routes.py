from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
import jwt

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

    if not reason or not parent_mobile:
        return jsonify({"success": False, "message": "Reason and parent mobile are required"}), 400

    # Only one active gatepass
    existing_active = GatePass.query.filter(
        GatePass.student_id == student.id,
        GatePass.status.in_(["PendingFaculty", "PendingHOD", "Approved"])
    ).first()

    if existing_active:
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

    return jsonify({"success": True, "message": "Gatepass applied successfully"}), 201


# =================================================
# FACULTY ACTION
# =================================================
@gatepass_bp.route("/faculty_action/<int:gatepass_id>", methods=["POST"])
@jwt_required()
def faculty_action(gatepass_id):

    faculty_id = int(get_jwt_identity())
    faculty = db.session.get(User, faculty_id)

    if not faculty or faculty.role != "faculty":
        return jsonify({"success": False, "message": "Only faculty can perform this action"}), 403

    data = request.get_json() or {}
    action = data.get("action")
    rejection_reason = data.get("rejection_reason")

    gatepass = db.session.get(GatePass, gatepass_id)

    if not gatepass or gatepass.status != "PendingFaculty":
        return jsonify({"success": False, "message": "Invalid gatepass"}), 400

    gatepass.faculty_id = faculty.id

    if action == "approve":
        gatepass.status = "PendingHOD"

    elif action == "reject":
        gatepass.status = "Rejected"
        gatepass.rejected_by = "Faculty"
        gatepass.rejection_reason = rejection_reason

    else:
        return jsonify({"success": False, "message": "Invalid action"}), 400

    db.session.commit()

    return jsonify({"success": True, "message": f"Gatepass {action}d successfully"})


# =================================================
# HOD FETCH PENDING GATEPASSES  🔥 (IMPORTANT)
# =================================================
@gatepass_bp.route("/hod/gatepasses/pending", methods=["GET"])
@jwt_required()
def hod_pending_gatepasses():

    hod_id = int(get_jwt_identity())
    hod = db.session.get(User, hod_id)

    if not hod or hod.role != "hod":
        return jsonify({"success": False, "message": "Access denied"}), 403

    gatepasses = GatePass.query.filter(
        GatePass.status == "PendingHOD"
    ).order_by(GatePass.created_at.desc()).all()

    return jsonify({
        "success": True,
        "gatepasses": [
            {
                "id": g.id,
                "student_name": g.student.name,
                "college_id": g.student.college_id,
                "year": g.student.year,
                "section": g.student.section,
                "reason": g.reason
            }
            for g in gatepasses
        ]
    }), 200


# =================================================
# HOD ACTION
# =================================================
@gatepass_bp.route("/hod_action/<int:gatepass_id>", methods=["POST"])
@jwt_required()
def hod_action(gatepass_id):

    hod_id = int(get_jwt_identity())
    hod = db.session.get(User, hod_id)

    if not hod or hod.role != "hod":
        return jsonify({"success": False, "message": "Only HOD can perform this action"}), 403

    data = request.get_json() or {}
    action = data.get("action")
    rejection_reason = data.get("rejection_reason")

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
        gatepass.status = "Rejected"
        gatepass.rejected_by = "HOD"
        gatepass.rejection_reason = rejection_reason

    else:
        return jsonify({"success": False, "message": "Invalid action"}), 400

    db.session.commit()

    return jsonify({"success": True, "message": f"Gatepass {action}d successfully"})


# =================================================
# STUDENT VIEW
# =================================================
@gatepass_bp.route("/my_gatepasses", methods=["GET"])
@jwt_required()
def my_gatepasses():

    student_id = int(get_jwt_identity())
    student = db.session.get(User, student_id)

    if not student or student.role != "student":
        return jsonify({"success": False, "message": "Access denied"}), 403

    gatepasses = GatePass.query.filter(
        GatePass.student_id == student.id
    ).order_by(GatePass.created_at.desc()).all()

    return jsonify({
        "success": True,
        "gatepasses": [
            {
                "id": g.id,
                "reason": g.reason,
                "status": g.status,
                "parent_mobile": g.parent_mobile,
                "created_at": g.created_at.isoformat(),
                "is_used": g.is_used,
                "qr_token": g.qr_token if g.status == "Approved" and not g.is_used else None,
                "rejected_by": g.rejected_by,
                "rejection_reason": g.rejection_reason
            }
            for g in gatepasses
        ]
    }), 200