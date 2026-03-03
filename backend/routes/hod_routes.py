from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
import jwt

from models import db, GatePass, User
from config import Config

hod_bp = Blueprint("hod_bp", __name__, url_prefix="/hod")
QR_ALGORITHM = "HS256"


# =====================================================
# VIEW PENDING GATEPASSES
# =====================================================
@hod_bp.route("/gatepasses/pending", methods=["GET"])
@jwt_required()
def hod_pending():

    user_id = int(get_jwt_identity())
    hod = db.session.get(User, user_id)

    if not hod or hod.role.lower() != "hod":
        return jsonify({"success": False, "message": "Access denied"}), 403

    if not hod.department:
        return jsonify({
            "success": False,
            "message": "HOD department not assigned"
        }), 400

    gatepasses = (
        GatePass.query
        .join(User, GatePass.student_id == User.id)
        .filter(GatePass.status == "PendingHOD")
        .filter(User.department.ilike(hod.department))
        .order_by(GatePass.created_at.desc())
        .all()
    )

    return jsonify({
        "success": True,
        "gatepasses": [
            {
                "id": gp.id,
                "student_name": gp.student.name,
                "college_id": gp.student.college_id,
                "department": gp.student.department,
                "year": gp.student.year,
                "section": gp.student.section,
                "reason": gp.reason,
                "status": gp.status,
                "created_at": gp.created_at.isoformat()
            }
            for gp in gatepasses
        ]
    }), 200


# =====================================================
# APPROVE BY HOD → GENERATE QR
# =====================================================
@hod_bp.route("/gatepasses/approve/<int:gatepass_id>", methods=["PUT"])
@jwt_required()
def hod_approve(gatepass_id):

    user_id = int(get_jwt_identity())
    hod = db.session.get(User, user_id)

    if not hod or hod.role.lower() != "hod":
        return jsonify({"success": False, "message": "Access denied"}), 403

    gp = db.session.get(GatePass, gatepass_id)

    if not gp or gp.status != "PendingHOD":
        return jsonify({
            "success": False,
            "message": "Gatepass not ready for approval"
        }), 400

    if gp.student.department.lower() != hod.department.lower():
        return jsonify({
            "success": False,
            "message": "Unauthorized department access"
        }), 403

    gp.status = "Approved"
    gp.hod_id = hod.id
    gp.is_used = False
    gp.used_at = None

    expiry = datetime.utcnow() + timedelta(minutes=10)

    payload = {
        "gatepass_id": gp.id,
        "student_id": gp.student_id,
        "exp": expiry
    }

    gp.qr_token = jwt.encode(
        payload,
        Config.QR_SECRET_KEY,
        algorithm=QR_ALGORITHM
    )

    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Gatepass approved & QR generated"
    }), 200