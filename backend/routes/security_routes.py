import jwt
from datetime import datetime
from flask import Blueprint, jsonify, request

from config import Config
from models import db, GatePass

security_bp = Blueprint("security_bp", __name__)

QR_ALGORITHM = "HS256"


# =========================================
# VERIFY QR (FINAL FIXED VERSION)
# =========================================
@security_bp.route("/verify_qr", methods=["POST"])
def verify_qr():
    try:
        data = request.get_json()
        qr_token = data.get("qr_token")

        if not qr_token:
            return jsonify({
                "success": False,
                "message": "QR token missing"
            }), 400

        # ================= DECODE QR =================
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

        # ================= GET GATEPASS =================
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

        # ================= IMAGE URL (FINAL FIX) =================
        base_url = request.host_url.rstrip("/")

        image_url = None
        if student:
            image_url = student.get_image_url(base_url)

        # ================= RESPONSE =================
        return jsonify({
            "success": True,
            "message": "Gatepass Verified",

            "gatepass_id": gatepass.id,

            "student_name": student.name,
            "college_id": student.college_id,
            "department": student.department,
            "year": student.year,
            "section": student.section,
            "parent_mobile": gatepass.parent_mobile,

            # 🔥 FINAL FIXED IMAGE
            "profile_image": image_url
        })

    # ================= ERRORS =================
    except jwt.ExpiredSignatureError:
        return jsonify({
            "success": False,
            "message": "QR expired"
        }), 401

    except jwt.InvalidTokenError:
        return jsonify({
            "success": False,
            "message": "Invalid QR token"
        }), 401

    except Exception as e:
        print("QR ERROR:", e)
        return jsonify({
            "success": False,
            "message": "Server error"
        }), 500


# =========================================
# CONFIRM EXIT
# =========================================
@security_bp.route("/confirm_exit/<int:gatepass_id>", methods=["POST"])
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

        # ================= UPDATE =================
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
    try:
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

    except Exception as e:
        print("HISTORY ERROR:", e)
        return jsonify([])


# =========================================
# DAILY EXIT COUNT
# =========================================
@security_bp.route("/exit-count", methods=["GET"])
def exit_count():
    try:
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

    except Exception as e:
        print("COUNT ERROR:", e)
        return jsonify({
            "date": str(datetime.utcnow().date()),
            "total_exits": 0
        })