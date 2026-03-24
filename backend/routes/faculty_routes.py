from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, User, GatePass
from utils.face_utils import compare_faces
import os

faculty_bp = Blueprint("faculty_bp", __name__)

# ================= BASE PATH =================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TEMP_FOLDER = os.path.join(BASE_DIR, "..", "temp")
os.makedirs(TEMP_FOLDER, exist_ok=True)


# =====================================================
# PENDING GATEPASSES
# =====================================================
@faculty_bp.route("/gatepasses/pending", methods=["GET"])
@jwt_required()
def pending_gatepasses():
    try:
        user_id = int(get_jwt_identity())
        faculty = db.session.get(User, user_id)

        if not faculty or faculty.role != "faculty":
            return jsonify({"message": "Access denied"}), 403

        gatepasses = (
            GatePass.query
            .join(User, GatePass.student_id == User.id)
            .filter(GatePass.status == "PendingFaculty")
            .filter(User.department == faculty.department)
            .filter(User.year == faculty.year)
            .filter(User.section == faculty.section)
            .all()
        )

        return jsonify({
            "gatepasses": [
                {
                    "id": gp.id,
                    "student_name": gp.student.name,
                    "reason": gp.reason,
                    "status": gp.status
                }
                for gp in gatepasses
            ]
        }), 200

    except Exception as e:
        print("PENDING ERROR:", e)
        return jsonify({"message": "Server error"}), 500


# =====================================================
# APPROVE / REJECT (MATCHES FRONTEND ✅)
# =====================================================
@faculty_bp.route("/gatepass/faculty_action/<int:gatepass_id>", methods=["POST"])
@jwt_required()
def faculty_action(gatepass_id):
    try:
        user_id = int(get_jwt_identity())
        faculty = db.session.get(User, user_id)

        if not faculty or faculty.role != "faculty":
            return jsonify({"message": "Access denied"}), 403

        gp = db.session.get(GatePass, gatepass_id)

        if not gp or gp.status != "PendingFaculty":
            return jsonify({"message": "Invalid gatepass"}), 400

        action = request.form.get("action")

        # ================= APPROVE =================
        if action == "approve":
            live_image = request.files.get("live_image")

            if not live_image:
                return jsonify({"message": "Live image required"}), 400

            if not faculty.face_image:
                return jsonify({"message": "Faculty face not registered"}), 400

            # Save temp image
            temp_path = os.path.join(TEMP_FOLDER, f"live_{gatepass_id}.jpg")

            try:
                live_image.save(temp_path)
            except Exception as e:
                print("IMAGE SAVE ERROR:", e)
                return jsonify({"message": "Image upload failed"}), 500

            # Face match
            try:
                match = compare_faces(faculty.face_image, temp_path)
            except Exception as e:
                print("FACE ERROR:", e)
                return jsonify({"message": "Face comparison failed"}), 500

            # Delete temp file
            if os.path.exists(temp_path):
                os.remove(temp_path)

            if not match:
                return jsonify({"message": "Face verification failed"}), 403

            gp.status = "PendingHOD"
            gp.faculty_id = faculty.id

            db.session.commit()

            return jsonify({"message": "Approved successfully"}), 200

        # ================= REJECT =================
        elif action == "reject":
            reason = request.form.get("rejection_reason")

            if not reason:
                return jsonify({"message": "Reason required"}), 400

            gp.status = "Rejected"
            gp.rejection_reason = reason
            gp.rejected_by = "Faculty"
            gp.faculty_id = faculty.id

            db.session.commit()

            return jsonify({"message": "Rejected successfully"}), 200

        else:
            return jsonify({"message": "Invalid action"}), 400

    except Exception as e:
        print("FACULTY ACTION ERROR:", e)
        return jsonify({"message": "Server error"}), 500


# =====================================================
# HISTORY
# =====================================================
@faculty_bp.route("/gatepasses/history", methods=["GET"])
@jwt_required()
def faculty_history():
    try:
        user_id = int(get_jwt_identity())
        faculty = db.session.get(User, user_id)

        if not faculty or faculty.role != "faculty":
            return jsonify({"message": "Access denied"}), 403

        gatepasses = (
            GatePass.query
            .join(User, GatePass.student_id == User.id)
            .filter(User.department == faculty.department)
            .filter(User.year == faculty.year)
            .filter(User.section == faculty.section)
            .all()
        )

        return jsonify({
            "gatepasses": [
                {
                    "id": gp.id,
                    "student_name": gp.student.name,
                    "status": gp.status
                }
                for gp in gatepasses
            ]
        }), 200

    except Exception as e:
        print("HISTORY ERROR:", e)
        return jsonify({"message": "Server error"}), 500