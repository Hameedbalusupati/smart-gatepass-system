from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, User, GatePass
import os

faculty_bp = Blueprint("faculty_bp", __name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TEMP_FOLDER = os.path.join(BASE_DIR, "..", "temp")
os.makedirs(TEMP_FOLDER, exist_ok=True)


# =====================================================
#  PENDING GATEPASSES
# =====================================================
@faculty_bp.route("/gatepasses/pending", methods=["GET"])
@jwt_required()
def pending_gatepasses():
    try:
        user_id = int(get_jwt_identity())
        faculty = db.session.get(User, user_id)

        if not faculty or faculty.role.lower() != "faculty":
            return jsonify({"message": "Access denied"}), 403

        gatepasses = (
            GatePass.query
            .join(User, GatePass.student_id == User.id)
            .filter(GatePass.status == "PendingFaculty")
            .filter(User.department == faculty.department)
            .order_by(GatePass.created_at.desc())
            .all()
        )

        return jsonify({
            "gatepasses": [
                {
                    "id": gp.id,
                    "student_name": gp.student.name,
                    "reason": gp.reason,
                    "parent_mobile": gp.parent_mobile,
                    "status": gp.status
                }
                for gp in gatepasses
            ]
        }), 200

    except Exception as e:
        print("PENDING ERROR:", e)
        return jsonify({"message": "Server error"}), 500


# =====================================================
#  APPROVE / REJECT
# =====================================================
@faculty_bp.route("/gatepass/faculty_action/<int:gatepass_id>", methods=["POST"])
@jwt_required()
def faculty_action(gatepass_id):
    try:
        user_id = int(get_jwt_identity())
        faculty = db.session.get(User, user_id)

        if not faculty or faculty.role.lower() != "faculty":
            return jsonify({"message": "Access denied"}), 403

        gp = db.session.get(GatePass, gatepass_id)

        if not gp or gp.status != "PendingFaculty":
            return jsonify({"message": "Invalid gatepass"}), 400

        data = request.get_json() or request.form

        action = data.get("action")
        rejection_reason = data.get("rejection_reason")

        if action == "approve":
            gp.status = "PendingHOD"
            gp.faculty_id = faculty.id

        elif action == "reject":
            if not rejection_reason:
                return jsonify({"message": "Reason required"}), 400

            gp.status = "Rejected"
            gp.rejection_reason = rejection_reason
            gp.rejected_by = "Faculty"
            gp.faculty_id = faculty.id

        else:
            return jsonify({"message": "Invalid action"}), 400

        db.session.commit()

        return jsonify({"message": "Updated successfully"}), 200

    except Exception as e:
        print("FACULTY ACTION ERROR:", e)
        return jsonify({"message": "Server error"}), 500


# =====================================================
#  HISTORY (🔥 FINAL FIX)
# =====================================================
@faculty_bp.route("/gatepasses/history", methods=["GET"])
@jwt_required()
def faculty_history():
    try:
        user_id = int(get_jwt_identity())
        faculty = db.session.get(User, user_id)

        if not faculty or faculty.role.lower() != "faculty":
            return jsonify({"message": "Access denied"}), 403

        # 🔥 IMPORTANT: show ALL data (no over filtering)
        gatepasses = (
            GatePass.query
            .order_by(GatePass.created_at.desc())
            .all()
        )

        result = []
        for gp in gatepasses:
            student = gp.student
            if not student:
                continue

            result.append({
                "id": gp.id,
                "student_name": student.name,
                "reason": gp.reason,
                "parent_mobile": gp.parent_mobile,
                "status": gp.status,
                "date": gp.created_at.strftime("%Y-%m-%d"),
                "time": gp.created_at.strftime("%H:%M")
            })

        return jsonify({"gatepasses": result}), 200

    except Exception as e:
        print("HISTORY ERROR:", e)
        return jsonify({"message": "Server error"}), 500