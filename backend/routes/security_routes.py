from flask import Blueprint, jsonify
from datetime import datetime
import jwt

from models import db, GatePass, User
from config import Config

# =================================================
# BLUEPRINT
# =================================================
security_bp = Blueprint("security_bp", __name__)

QR_ALGORITHM = "HS256"


# =================================================
# SCAN QR CODE (ONE-TIME USE)
# =================================================
@security_bp.route("/scan/<string:qr_token>", methods=["GET"])
def scan_qr(qr_token):

    try:
        # =========================
        # VERIFY & DECODE QR TOKEN
        # =========================
        decoded = jwt.decode(
            qr_token,
            Config.QR_SECRET_KEY,
            algorithms=[QR_ALGORITHM]
        )

        gatepass_id = decoded.get("gatepass_id")

        if not gatepass_id:
            return jsonify({
                "success": False,
                "message": "Invalid QR data"
            }), 400

        # =========================
        # FETCH GATEPASS
        # =========================
        gatepass = db.session.get(GatePass, gatepass_id)

        if not gatepass:
            return jsonify({
                "success": False,
                "message": "Gatepass not found"
            }), 404

        # =========================
        # CHECK STATUS
        # =========================
        if gatepass.status != "Approved":
            return jsonify({
                "success": False,
                "message": "Gatepass not valid"
            }), 400

        # =========================
        # CHECK IF ALREADY USED
        # =========================
        if gatepass.is_used:
            return jsonify({
                "success": False,
                "message": "QR already used"
            }), 400

        # =========================
        # MARK AS USED
        # =========================
        now = datetime.utcnow()

        gatepass.is_used = True
        gatepass.used_at = now
        gatepass.status = "Completed"
        gatepass.out_time = now

        db.session.commit()

        student = gatepass.student

        return jsonify({
            "success": True,
            "message": "Gatepass Verified",
            "student": {
                "name": student.name,
                "college_id": student.college_id,
                "department": student.department,
                "year": student.year,
                "section": student.section
            },
            "gatepass": {
                "id": gatepass.id,
                "reason": gatepass.reason,
                "parent_mobile": gatepass.parent_mobile,
                "out_time": gatepass.out_time.isoformat()
            }
        }), 200

    # =========================
    # QR EXPIRED
    # =========================
    except jwt.ExpiredSignatureError:
        return jsonify({
            "success": False,
            "message": "QR Code expired"
        }), 410

    # =========================
    # INVALID TOKEN
    # =========================
    except jwt.InvalidTokenError:
        return jsonify({
            "success": False,
            "message": "Invalid QR Code"
        }), 400

    # =========================
    # UNKNOWN ERROR
    # =========================
    except Exception as e:
        print("QR SCAN ERROR:", e)
        return jsonify({
            "success": False,
            "message": "Internal server error"
        }), 500