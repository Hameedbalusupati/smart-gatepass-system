from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from models import db, User, GatePass

faculty_bp = Blueprint("faculty_bp", __name__, url_prefix="/faculty")


# =====================================================
# VIEW PENDING GATEPASSES (FACULTY)
# =====================================================
@faculty_bp.route("/gatepasses/pending", methods=["GET"])
@jwt_required()
def pending_gatepasses():

    user_id = int(get_jwt_identity())
    faculty = db.session.get(User, user_id)

    if not faculty or faculty.role.lower() != "faculty":
        return jsonify({"success": False, "message": "Access denied"}), 403

    if not faculty.department or not faculty.year or not faculty.section:
        return jsonify({
            "success": False,
            "message": "Faculty class details not assigned"
        }), 400

    gatepasses = (
        GatePass.query
        .join(User, GatePass.student_id == User.id)
        .filter(GatePass.status == "PendingFaculty")
        .filter(User.department == faculty.department)
        .filter(User.year == faculty.year)
        .filter(User.section == faculty.section)
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


# =====================================================
# APPROVE → FORWARD TO HOD
# =====================================================
@faculty_bp.route("/gatepasses/approve/<int:gatepass_id>", methods=["PUT"])
@jwt_required()
def approve_gatepass(gatepass_id):

    user_id = int(get_jwt_identity())
    faculty = db.session.get(User, user_id)

    if not faculty or faculty.role.lower() != "faculty":
        return jsonify({"success": False, "message": "Access denied"}), 403

    gp = db.session.get(GatePass, gatepass_id)

    if not gp or gp.status != "PendingFaculty":
        return jsonify({
            "success": False,
            "message": "Invalid or already processed gatepass"
        }), 400

    # verify student belongs to this faculty class
    student = gp.student

    if (
        student.department != faculty.department
        or student.year != faculty.year
        or student.section != faculty.section
    ):
        return jsonify({
            "success": False,
            "message": "Unauthorized access to this gatepass"
        }), 403

    gp.status = "PendingHOD"
    gp.faculty_id = faculty.id

    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Gatepass forwarded to HOD successfully"
    }), 200


# =====================================================
# REJECT BY FACULTY
# =====================================================
@faculty_bp.route("/gatepasses/reject/<int:gatepass_id>", methods=["PUT"])
@jwt_required()
def reject_gatepass(gatepass_id):

    user_id = int(get_jwt_identity())
    faculty = db.session.get(User, user_id)

    if not faculty or faculty.role.lower() != "faculty":
        return jsonify({"success": False, "message": "Access denied"}), 403

    gp = db.session.get(GatePass, gatepass_id)

    if not gp or gp.status != "PendingFaculty":
        return jsonify({
            "success": False,
            "message": "Invalid or already processed gatepass"
        }), 400

    data = request.get_json() or {}
    rejection_reason = (data.get("rejection_reason") or "").strip()

    if not rejection_reason:
        return jsonify({
            "success": False,
            "message": "Rejection reason required"
        }), 400

    gp.status = "Rejected"
    gp.rejected_by = "Faculty"
    gp.rejection_reason = rejection_reason
    gp.faculty_id = faculty.id

    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Gatepass rejected successfully"
    }), 200


# =====================================================
# FACULTY GATEPASS HISTORY
# =====================================================
@faculty_bp.route("/gatepasses/history", methods=["GET"])
@jwt_required()
def faculty_history():

    user_id = int(get_jwt_identity())
    faculty = db.session.get(User, user_id)

    if not faculty or faculty.role.lower() != "faculty":
        return jsonify({"success": False, "message": "Access denied"}), 403

    gatepasses = (
        GatePass.query
        .join(User, GatePass.student_id == User.id)
        .filter(User.department == faculty.department)
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
                "rejected_by": gp.rejected_by,
                "rejection_reason": gp.rejection_reason,
                "created_at": gp.created_at.isoformat()
            }
            for gp in gatepasses
        ]
    }), 200