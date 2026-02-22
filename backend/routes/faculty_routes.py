from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime

from models import db, User, GatePass

# =========================================================
# BLUEPRINT (NO url_prefix HERE)
# =========================================================
faculty_bp = Blueprint("faculty_bp", __name__)

# =========================================================
# VIEW PENDING GATEPASSES (FACULTY)
# =========================================================
@faculty_bp.route("/gatepasses/pending", methods=["GET"])
@jwt_required()
def pending_gatepasses():
    faculty_id = get_jwt_identity()

    faculty = User.query.get(int(faculty_id))
    if not faculty or faculty.role != "faculty":
        return jsonify({
            "success": False,
            "message": "Access denied"
        }), 403

    # Safety check
    if faculty.department is None or faculty.year is None or faculty.section is None:
        return jsonify({
            "success": False,
            "message": "Faculty class details not assigned"
        }), 400

    gatepasses = (
        GatePass.query
        .join(User, GatePass.student_id == User.id)
        .filter(
            GatePass.status == "PendingFaculty",
            User.department == faculty.department,
            User.year == faculty.year,
            User.section == faculty.section
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
                "parent_mobile": gp.parent_mobile,
                "status": gp.status,
                "created_at": gp.created_at.isoformat()
            }
            for gp in gatepasses
        ]
    }), 200


# =========================================================
# APPROVE GATEPASS → FORWARD TO HOD
# =========================================================
@faculty_bp.route("/gatepasses/approve/<int:gatepass_id>", methods=["PUT"])
@jwt_required()
def approve_gatepass(gatepass_id):
    faculty_id = get_jwt_identity()
    faculty = User.query.get(int(faculty_id))

    if not faculty or faculty.role != "faculty":
        return jsonify({
            "success": False,
            "message": "Access denied"
        }), 403

    gp = GatePass.query.get(gatepass_id)
    if not gp or gp.status != "PendingFaculty":
        return jsonify({
            "success": False,
            "message": "Invalid or already processed gatepass"
        }), 400

    gp.status = "PendingHOD"   # 🔥 FIXED (consistent status name)
    gp.faculty_id = faculty.id
    gp.faculty_approved_at = datetime.utcnow()

    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Gatepass approved and forwarded to HOD"
    }), 200


# =========================================================
# REJECT GATEPASS (FACULTY)
# =========================================================
@faculty_bp.route("/gatepasses/reject/<int:gatepass_id>", methods=["PUT"])
@jwt_required()
def reject_gatepass(gatepass_id):
    faculty_id = get_jwt_identity()
    faculty = User.query.get(int(faculty_id))

    if not faculty or faculty.role != "faculty":
        return jsonify({
            "success": False,
            "message": "Access denied"
        }), 403

    gp = GatePass.query.get(gatepass_id)
    if not gp or gp.status != "PendingFaculty":
        return jsonify({
            "success": False,
            "message": "Invalid or already processed gatepass"
        }), 400

    gp.status = "Rejected"
    gp.faculty_id = faculty.id
    gp.faculty_approved_at = datetime.utcnow()

    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Gatepass rejected successfully"
    }), 200