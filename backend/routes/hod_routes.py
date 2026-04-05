from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
import jwt

from models import db, GatePass, User
from config import Config

hod_bp = Blueprint("hod_bp", __name__, url_prefix="/hod")

QR_ALGORITHM = "HS256"


# =====================================================
# GET CURRENT HOD
# =====================================================
def get_current_hod():
    try:
        user_id = int(get_jwt_identity())
    except:
        return None

    user = db.session.get(User, user_id)

    if not user or user.role.lower() != "hod":
        return None

    return user


# =====================================================
# VIEW PENDING GATEPASSES
# =====================================================
@hod_bp.route("/gatepasses/pending", methods=["GET"])
@jwt_required()
def hod_pending():

    hod = get_current_hod()
    if not hod:
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
        .filter(User.department == hod.department)
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
                "parent_mobile": gp.parent_mobile,  #  FIXED
                "status": gp.status,
                "created_at": gp.created_at.isoformat()
            }
            for gp in gatepasses
        ]
    })


# =====================================================
# APPROVE GATEPASS
# =====================================================
@hod_bp.route("/gatepasses/approve/<int:gatepass_id>", methods=["PUT"])
@jwt_required()
def hod_approve(gatepass_id):

    hod = get_current_hod()
    if not hod:
        return jsonify({"success": False, "message": "Access denied"}), 403

    gp = db.session.get(GatePass, gatepass_id)

    if not gp:
        return jsonify({"success": False, "message": "Gatepass not found"}), 404

    if gp.status != "PendingHOD":
        return jsonify({
            "success": False,
            "message": "Gatepass not ready for approval"
        }), 400

    if gp.student.department != hod.department:
        return jsonify({
            "success": False,
            "message": "Unauthorized department access"
        }), 403

    # ================= APPROVE =================
    gp.status = "Approved"
    gp.hod_id = hod.id
    gp.is_used = False
    gp.used_at = None
    gp.hod_approved_at = datetime.utcnow()

    # ================= GENERATE QR =================
    payload = {
        "gatepass_id": gp.id,
        "exp": datetime.utcnow() + timedelta(hours=6)
    }

    try:
        gp.qr_token = jwt.encode(
            payload,
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
    })


# =====================================================
# REJECT GATEPASS
# =====================================================
@hod_bp.route("/gatepasses/reject/<int:gatepass_id>", methods=["PUT"])
@jwt_required()
def hod_reject(gatepass_id):

    hod = get_current_hod()
    if not hod:
        return jsonify({"success": False, "message": "Access denied"}), 403

    gp = db.session.get(GatePass, gatepass_id)

    if not gp:
        return jsonify({"success": False, "message": "Gatepass not found"}), 404

    if gp.status != "PendingHOD":
        return jsonify({
            "success": False,
            "message": "Gatepass cannot be rejected"
        }), 400

    data = request.get_json() or {}
    rejection_reason = (data.get("rejection_reason") or "").strip()

    if not rejection_reason:
        return jsonify({
            "success": False,
            "message": "Rejection reason required"
        }), 400

    # ================= REJECT =================
    gp.status = "Rejected"
    gp.hod_id = hod.id
    gp.rejected_by = "HOD"
    gp.rejection_reason = rejection_reason

    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Gatepass rejected successfully"
    })


# =====================================================
# HOD HISTORY
# =====================================================
@hod_bp.route("/gatepasses/history", methods=["GET"])
@jwt_required()
def hod_history():

    hod = get_current_hod()
    if not hod:
        return jsonify({"success": False, "message": "Access denied"}), 403

    gatepasses = (
        GatePass.query
        .join(User, GatePass.student_id == User.id)
        .filter(User.department == hod.department)
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
                "parent_mobile": gp.parent_mobile,  #  IMPORTANT
                "status": gp.status,
                "created_at": gp.created_at.isoformat()
            }
            for gp in gatepasses
        ]
    })