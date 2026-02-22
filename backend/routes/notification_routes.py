from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

# =====================================================
# BLUEPRINT (NO url_prefix, NO CORS HERE)
# =====================================================
notifications_bp = Blueprint("notifications_bp", __name__)


# =====================================================
# GET NOTIFICATIONS (SAFE PLACEHOLDER)
# =====================================================
@notifications_bp.route("/", methods=["GET"])
@jwt_required()
def get_notifications():
    try:
        user_id = int(get_jwt_identity())

        # 🔔 Placeholder notifications (future DB-based)
        return jsonify({
            "success": True,
            "notifications": [],
            "unread_count": 0
        }), 200

    except Exception as e:
        print("Notification error:", e)
        return jsonify({
            "success": False,
            "message": "Failed to fetch notifications"
        }), 500