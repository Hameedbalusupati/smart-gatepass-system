# from flask import Blueprint, jsonify
# from flask_jwt_extended import jwt_required, get_jwt_identity
# from datetime import datetime, timedelta
# import jwt

# from models import db, GatePass, User
# from config import Config

# # =====================================================
# # BLUEPRINT
# # =====================================================
# hod_bp = Blueprint("hod_bp", __name__)

# QR_ALGORITHM = "HS256"


# # =====================================================
# # VIEW PENDING GATEPASSES (HOD – DEPARTMENT WISE)
# # =====================================================
# @hod_bp.route("/gatepasses/pending", methods=["GET"])
# @jwt_required()
# def hod_pending():

#     try:
#         hod_id = int(get_jwt_identity())
#     except (TypeError, ValueError):
#         return jsonify({"success": False, "message": "Invalid token"}), 401

#     hod = db.session.get(User, hod_id)

#     if not hod or hod.role != "hod":
#         return jsonify({"success": False, "message": "Access denied"}), 403

#     if not hod.department:
#         return jsonify(
#             {"success": False, "message": "HOD department not assigned"}
#         ), 400

#     gatepasses = (
#         GatePass.query
#         .join(User, GatePass.student_id == User.id)
#         .filter(
#             GatePass.status == "PendingHOD",
#             User.department == hod.department
#         )
#         .order_by(GatePass.created_at.desc())
#         .all()
#     )

#     return jsonify({
#         "success": True,
#         "gatepasses": [
#             {
#                 "id": gp.id,
#                 "student_name": gp.student.name,
#                 "college_id": gp.student.college_id,
#                 "department": gp.student.department,
#                 "year": gp.student.year,
#                 "section": gp.student.section,
#                 "reason": gp.reason,
#                 "parent_mobile": gp.parent_mobile,
#                 "status": gp.status,
#                 "created_at": gp.created_at.isoformat()
#             }
#             for gp in gatepasses
#         ]
#     }), 200


# # =====================================================
# # APPROVE GATEPASS → GENERATE QR FOR STUDENT
# # =====================================================
# @hod_bp.route("/gatepasses/approve/<int:gatepass_id>", methods=["PUT"])
# @jwt_required()
# def hod_approve(gatepass_id):

#     try:
#         hod_id = int(get_jwt_identity())
#     except (TypeError, ValueError):
#         return jsonify({"success": False, "message": "Invalid token"}), 401

#     hod = db.session.get(User, hod_id)

#     if not hod or hod.role != "hod":
#         return jsonify({"success": False, "message": "Access denied"}), 403

#     gp = db.session.get(GatePass, gatepass_id)

#     if not gp:
#         return jsonify({"success": False, "message": "Gatepass not found"}), 404

#     if gp.status != "PendingHOD":
#         return jsonify(
#             {"success": False, "message": "Gatepass not ready for approval"}
#         ), 400

#     # =========================
#     # UPDATE STATUS TO APPROVED
#     # =========================
#     gp.status = "Approved"
#     gp.hod_id = hod.id

#     # Reset usage flags
#     gp.is_used = False
#     gp.used_at = None

#     # =========================
#     # GENERATE QR TOKEN (10 MIN VALID)
#     # =========================
#     expiry_time = datetime.utcnow() + timedelta(minutes=10)

#     qr_payload = {
#         "gatepass_id": gp.id,
#         "student_id": gp.student_id,
#         "exp": expiry_time
#     }

#     try:
#         token = jwt.encode(
#             qr_payload,
#             Config.QR_SECRET_KEY,
#             algorithm=QR_ALGORITHM
#         )
#         gp.qr_token = token
#     except Exception as e:
#         print("QR GENERATION ERROR:", e)
#         return jsonify(
#             {"success": False, "message": "QR generation failed"}
#         ), 500

#     db.session.commit()

#     return jsonify({
#         "success": True,
#         "message": "Gatepass approved. QR generated for student."
#     }), 200


# # =====================================================
# # REJECT GATEPASS
# # =====================================================
# @hod_bp.route("/gatepasses/reject/<int:gatepass_id>", methods=["PUT"])
# @jwt_required()
# def hod_reject(gatepass_id):

#     try:
#         hod_id = int(get_jwt_identity())
#     except (TypeError, ValueError):
#         return jsonify({"success": False, "message": "Invalid token"}), 401

#     hod = db.session.get(User, hod_id)

#     if not hod or hod.role != "hod":
#         return jsonify({"success": False, "message": "Access denied"}), 403

#     gp = db.session.get(GatePass, gatepass_id)

#     if not gp:
#         return jsonify({"success": False, "message": "Gatepass not found"}), 404

#     if gp.status != "PendingHOD":
#         return jsonify(
#             {"success": False, "message": "Gatepass not rejectable"}
#         ), 400

#     gp.status = "Rejected"
#     gp.hod_id = hod.id

#     db.session.commit()

#     return jsonify({
#         "success": True,
#         "message": "Gatepass rejected successfully"
#     }), 200



from flask import Blueprint, jsonify
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

    try:
        hod_id = int(get_jwt_identity())
    except:
        return jsonify({"success": False, "message": "Invalid token"}), 401

    hod = db.session.get(User, hod_id)

    if not hod or hod.role != "hod":
        return jsonify({"success": False, "message": "Access denied"}), 403

    gatepasses = (
        GatePass.query
        .join(User, GatePass.student_id == User.id)
        .filter(
            GatePass.status == "PendingHOD",
            User.department == hod.department
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
# APPROVE GATEPASS → GENERATE QR FOR STUDENT
# =====================================================
@hod_bp.route("/gatepasses/approve/<int:gatepass_id>", methods=["PUT"])
@jwt_required()
def hod_approve(gatepass_id):

    try:
        hod_id = int(get_jwt_identity())
    except:
        return jsonify({"success": False, "message": "Invalid token"}), 401

    hod = db.session.get(User, hod_id)

    if not hod or hod.role != "hod":
        return jsonify({"success": False, "message": "Access denied"}), 403

    gp = db.session.get(GatePass, gatepass_id)

    if not gp:
        return jsonify({"success": False, "message": "Gatepass not found"}), 404

    if gp.status != "PendingHOD":
        return jsonify({
            "success": False,
            "message": "Gatepass not ready for approval"
        }), 400

    # =========================
    # UPDATE STATUS
    # =========================
    gp.status = "Approved"
    gp.is_used = False
    gp.used_at = None

    # =========================
    # GENERATE QR TOKEN (VALID 10 MINUTES)
    # =========================
    expiry_time = datetime.utcnow() + timedelta(minutes=10)

    qr_payload = {
        "gatepass_id": gp.id,
        "student_id": gp.student_id,
        "student_name": gp.student.name,
        "college_id": gp.student.college_id,
        "department": gp.student.department,
        "year": gp.student.year,
        "section": gp.student.section,
        "reason": gp.reason,
        "parent_mobile": gp.parent_mobile,
        "exp": expiry_time
    }

    try:
        qr_token = jwt.encode(
            qr_payload,
            Config.QR_SECRET_KEY,
            algorithm=QR_ALGORITHM
        )
        gp.qr_token = qr_token
    except Exception as e:
        print("QR GENERATION ERROR:", e)
        return jsonify({
            "success": False,
            "message": "QR generation failed"
        }), 500

    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Gatepass approved. QR generated successfully."
    }), 200


# =====================================================
# REJECT GATEPASS
# =====================================================
@hod_bp.route("/gatepasses/reject/<int:gatepass_id>", methods=["PUT"])
@jwt_required()
def hod_reject(gatepass_id):

    try:
        hod_id = int(get_jwt_identity())
    except:
        return jsonify({"success": False, "message": "Invalid token"}), 401

    hod = db.session.get(User, hod_id)

    if not hod or hod.role != "hod":
        return jsonify({"success": False, "message": "Access denied"}), 403

    gp = db.session.get(GatePass, gatepass_id)

    if not gp:
        return jsonify({"success": False, "message": "Gatepass not found"}), 404

    if gp.status != "PendingHOD":
        return jsonify({
            "success": False,
            "message": "Gatepass not rejectable"
        }), 400

    gp.status = "Rejected"
    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Gatepass rejected successfully"
    }), 200