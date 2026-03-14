import os
from datetime import datetime
from flask import Blueprint, jsonify, request
import jwt

from config import Config
from models import db, GatePass

security_bp = Blueprint("security_bp", __name__)

QR_ALGORITHM = "HS256"


# =========================================
# SCAN QR CODE
# =========================================
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

        gatepass = db.session.get(GatePass, gatepass_id)

        if not gatepass:
            return jsonify({
                "success": False,
                "message": "Gatepass not found"
            }), 404

        if gatepass.status != "Approved":
            return jsonify({
                "success": False,
                "message": "Gatepass not approved"
            }), 400

        student = gatepass.student

        # Build image URL
        image_url = None
        if student.profile_image:
            filename = os.path.basename(student.profile_image)
            image_url = request.host_url + "uploads/student_images/" + filename

        return jsonify({
            "success": True,
            "message": "Gatepass Verified",

            "student": {
                "name": student.name,
                "roll_no": student.college_id,
                "department": student.department,
                "year": student.year,
                "section": student.section,
                "profile_image": image_url
            },

            "gatepass": {
                "id": gatepass.id,
                "reason": gatepass.reason
            }
        })

    except Exception as e:
        print("QR ERROR:", e)

        return jsonify({
            "success": False,
            "message": "Server error"
        }), 500


# =========================================
# CONFIRM EXIT
# =========================================
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

        print("EXIT ERROR:", e)

        return jsonify({
            "success": False,
            "message": "Server error"
        }), 500


# =========================================
# EXIT HISTORY
# =========================================
@security_bp.route("/exit-history", methods=["GET"])
def exit_history():

    exits = GatePass.query.filter_by(status="Completed").all()

    data = []

    for g in exits:

        data.append({
            "name": g.student.name,
            "roll": g.student.college_id,
            "department": g.student.department,
            "time": g.out_time
        })

    return jsonify(data)


# =========================================
# DAILY EXIT COUNT
# =========================================
@security_bp.route("/exit-count", methods=["GET"])
def exit_count():

    today = datetime.utcnow().date()

    exits = GatePass.query.filter(
        GatePass.status == "Completed"
    ).all()

    count = 0

    for g in exits:
        if g.out_time and g.out_time.date() == today:
            count += 1

    return jsonify({
        "date": str(today),
        "total_exits": count
    })