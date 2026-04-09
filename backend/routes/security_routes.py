import jwt
from datetime import datetime
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func

from config import Config
from models import db, GatePass

security_bp = Blueprint("security_bp", __name__)

QR_ALGORITHM = "HS256"


# =========================================
# VERIFY QR
# =========================================
@security_bp.route("/verify_qr", methods=["POST"])
@jwt_required()   # 🔥 SECURITY FIX
def verify_qr():
    try:
        data = request.get_json() or {}   # 🔥 FIX
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
                "message": "Invalid QR data"
            }), 400

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

        if not student:
            return jsonify({
                "success": False,
                "message": "Student not found"
            }), 404

        base_url = request.host_url.rstrip("/")
        image_url = student.get_image_url(base_url)

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

            "profile_image": image_url
        })

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
@jwt_required()   # 🔥 SECURITY FIX
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
@jwt_required()
def exit_history():
    try:
        exits = GatePass.query.filter_by(status="Completed").all()

        data = []
        for g in exits:
            if not g.student:
                continue

            data.append({
                "name": g.student.name,
                "roll": g.student.college_id,
                "department": g.student.department,
                "time": g.out_time.isoformat() if g.out_time else None
            })

        return jsonify(data)

    except Exception as e:
        print("HISTORY ERROR:", e)
        return jsonify([])


# =========================================
# DAILY EXIT COUNT (FAST FIX)
# =========================================
@security_bp.route("/exit-count", methods=["GET"])
@jwt_required()
def exit_count():
    try:
        today = datetime.utcnow().date()

        count = db.session.query(func.count(GatePass.id)).filter(
            GatePass.status == "Completed",
            func.date(GatePass.out_time) == today
        ).scalar()

        return jsonify({
            "date": str(today),
            "total_exits": count or 0
        })

    except Exception as e:
        print("COUNT ERROR:", e)
        return jsonify({
            "date": str(datetime.utcnow().date()),
            "total_exits": 0
        })