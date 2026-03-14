from flask import Blueprint, jsonify, request
from datetime import datetime
import jwt
import os

from models import db, GatePass
from config import Config

security_bp = Blueprint("security_bp", __name__, url_prefix="/api/security")

QR_ALGORITHM = "HS256"


# ============================================
# SCAN QR CODE
# ============================================
@security_bp.route("/scan", methods=["POST"])
def scan_qr():

    try:

        data = request.get_json()
        qr_token = data.get("qr_token")

        if not qr_token:
            return jsonify({
                "success": False,
                "message": "QR token missing"
            }), 400


        decoded = jwt.decode(
            qr_token,
            Config.QR_SECRET_KEY,
            algorithms=[QR_ALGORITHM]
        )

        gatepass_id = decoded.get("gatepass_id")

        if not gatepass_id:
            return jsonify({
                "success": False,
                "message": "Invalid QR Code"
            }), 400


        gatepass = db.session.get(GatePass, gatepass_id)

        if not gatepass:
            return jsonify({
                "success": False,
                "message": "Gatepass not found"
            }), 404


        if gatepass.is_used:
            return jsonify({
                "success": False,
                "message": "Gatepass already used"
            }), 400


        if gatepass.status != "Approved":
            return jsonify({
                "success": False,
                "message": "Gatepass not approved"
            }), 400


        student = gatepass.student

        image_url = None

        if student.profile_image:
            filename = os.path.basename(student.profile_image)
            image_url = f"{Config.API_BASE_URL}/uploads/student_images/{filename}"


        return jsonify({

            "success": True,
            "message": "Gatepass Verified",

            "student_name": student.name,
            "roll_no": student.college_id,
            "gatepass_id": gatepass.id,

            "student": {
                "id": student.id,
                "name": student.name,
                "college_id": student.college_id,
                "department": student.department,
                "year": student.year,
                "section": student.section,
                "profile_image": image_url
            },

            "gatepass": {
                "id": gatepass.id,
                "reason": gatepass.reason,
                "parent_mobile": gatepass.parent_mobile
            }

        }), 200


    except jwt.ExpiredSignatureError:

        return jsonify({
            "success": False,
            "message": "QR Code expired"
        }), 410


    except jwt.InvalidTokenError:

        return jsonify({
            "success": False,
            "message": "Invalid QR Code"
        }), 400


    except Exception as e:

        print("QR ERROR:", e)

        return jsonify({
            "success": False,
            "message": "Server error"
        }), 500


# ============================================
# CONFIRM EXIT
# ============================================
@security_bp.route("/confirm/<int:gatepass_id>", methods=["POST"])
def confirm_exit(gatepass_id):

    try:

        gatepass = db.session.get(GatePass, gatepass_id)

        if not gatepass:
            return jsonify({
                "success": False,
                "message": "Gatepass not found"
            }), 404


        if gatepass.is_used:
            return jsonify({
                "success": False,
                "message": "Already exited"
            }), 400


        gatepass.is_used = True
        gatepass.status = "Completed"
        gatepass.out_time = datetime.utcnow()

        db.session.commit()

        return jsonify({
            "success": True,
            "message": "Exit recorded successfully"
        })

    except Exception as e:

        print("CONFIRM ERROR:", e)

        return jsonify({
            "success": False,
            "message": "Server error"
        }), 500