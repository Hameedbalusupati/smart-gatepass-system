from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
import jwt

from models import db, GatePass, User
from config import Config

hod_bp = Blueprint("hod_bp", __name__)
QR_ALGORITHM = "HS256"


# =====================================================
# VIEW PENDING GATEPASSES (HOD)
# =====================================================
@hod_bp.route("/gatepasses/pending", methods=["GET"])
@jwt_required()
def hod_pending():

    user_id = int(get_jwt_identity())
    hod = db.session.get(User, user_id)

    if not hod or hod.role != "hod":
        return jsonify({
            "success": False,
            "message": "Access denied"
        }), 403

    # Department based filtering
    gatepasses = (
        GatePass.query
        .join(User, GatePass.student_id == User.id)
        .filter(
            GatePass.status == "PendingHOD",
            User.department == hod.department   # IMPORTANT
        )
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
                "status": gp.status
            }
            for gp in gatepasses
        ]
    }), 200


# =====================================================
# APPROVE GATEPASS → GENERATE QR
# =====================================================
@hod_bp.route("/gatepasses/approve/<int:gatepass_id>", methods=["PUT"])
@jwt_required()
def hod_approve(gatepass_id):

    user_id = int(get_jwt_identity())
    hod = db.session.get(User, user_id)

    if not hod or hod.role != "hod":
        return jsonify({
            "success": False,
            "message": "Access denied"
        }), 403

    gp = db.session.get(GatePass, gatepass_id)

    if not gp:
        return jsonify({
            "success": False,
            "message": "Gatepass not found"
        }), 404

    if gp.status != "PendingHOD":
        return jsonify({
            "success": False,
            "message": "Gatepass not ready for approval"
        }), 400

    # Ensure same department
    if gp.student.department != hod.department:
        return jsonify({
            "success": False,
            "message": "Unauthorized department access"
        }), 403

    # =========================
    # UPDATE STATUS
    # =========================
    gp.status = "Approved"
    gp.hod_id = hod.id
    gp.is_used = False
    gp.used_at = None

    # =========================
    # GENERATE QR TOKEN (10 MIN)
    # =========================
    expiry_time = datetime.utcnow() + timedelta(minutes=10)

    qr_payload = {
        "gatepass_id": gp.id,
        "student_id": gp.student_id,
        "exp": expiry_time
    }

    try:
        gp.qr_token = jwt.encode(
            qr_payload,
            Config.QR_SECRET_KEY,
            algorithm=QR_ALGORITHM
        )
    except Exception as e:
        print("QR ERROR:", e)
        return jsonify({
            "success": False,
            "message": "QR generation failed"
        }), 500

    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Gatepass approved successfully"
    }), 200


# =====================================================
# REJECT GATEPASS
# =====================================================
@hod_bp.route("/gatepasses/reject/<int:gatepass_id>", methods=["PUT"])
@jwt_required()
def hod_reject(gatepass_id):

    user_id = int(get_jwt_identity())
    hod = db.session.get(User, user_id)

    if not hod or hod.role != "hod":
        return jsonify({
            "success": False,
            "message": "Access denied"
        }), 403

    gp = db.session.get(GatePass, gatepass_id)

    if not gp:
        return jsonify({
            "success": False,
            "message": "Gatepass not found"
        }), 404

    if gp.status != "PendingHOD":
        return jsonify({
            "success": False,
            "message": "Gatepass not rejectable"
        }), 400

    if gp.student.department != hod.department:
        return jsonify({
            "success": False,
            "message": "Unauthorized department access"
        }), 403

    data = request.get_json() or {}
    rejection_reason = data.get("rejection_reason", "Rejected by HOD")

    gp.status = "Rejected"
    gp.rejected_by = "HOD"
    gp.rejection_reason = rejection_reason
    gp.hod_id = hod.id

    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Gatepass rejected successfully"
    }), 200