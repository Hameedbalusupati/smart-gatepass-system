from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import text
from models import db

# ================================================
# BLUEPRINT
# ================================================
notifications_bp = Blueprint("notifications_bp", __name__)

# ================================================
# CREATE NOTIFICATION
# ================================================
@notifications_bp.route("/", methods=["POST"])
@jwt_required()
def create_notification():
    try:
        data = request.json
        user_email = data.get("user_email")
        message = data.get("message")

        if not user_email or not message:
            return jsonify({
                "success": False,
                "message": "Missing data"
            }), 400

        db.session.execute(
            text("""
                INSERT INTO notifications (user_email, message)
                VALUES (:user_email, :message)
            """),
            {
                "user_email": user_email,
                "message": message
            }
        )

        db.session.commit()

        return jsonify({
            "success": True,
            "message": "Notification created successfully"
        }), 201

    except Exception as e:
        db.session.rollback()
        print("Create Notification Error:", e)
        return jsonify({
            "success": False,
            "message": "Failed to create notification"
        }), 500


# ================================================
# GET USER NOTIFICATIONS
# ================================================
@notifications_bp.route("/", methods=["GET"])
@jwt_required()
def get_notifications():
    try:
        user_email = get_jwt_identity()   # identity should store email during login

        result = db.session.execute(
            text("""
                SELECT id, message, is_read, created_at
                FROM notifications
                WHERE user_email = :email
                ORDER BY created_at DESC
            """),
            {"email": user_email}
        )

        rows = result.fetchall()

        notifications = [
            {
                "id": row[0],
                "message": row[1],
                "is_read": row[2],
                "created_at": row[3]
            }
            for row in rows
        ]

        unread_count = sum(1 for n in notifications if not n["is_read"])

        return jsonify({
            "success": True,
            "notifications": notifications,
            "unread_count": unread_count
        }), 200

    except Exception as e:
        print("Get Notification Error:", e)
        return jsonify({
            "success": False,
            "message": "Failed to fetch notifications"
        }), 500


# ================================================
# MARK AS READ
# ================================================
@notifications_bp.route("/read/<int:notification_id>", methods=["PUT"])
@jwt_required()
def mark_as_read(notification_id):
    try:
        db.session.execute(
            text("""
                UPDATE notifications
                SET is_read = TRUE
                WHERE id = :id
            """),
            {"id": notification_id}
        )

        db.session.commit()

        return jsonify({
            "success": True,
            "message": "Marked as read"
        }), 200

    except Exception as e:
        db.session.rollback()
        print("Mark Read Error:", e)
        return jsonify({
            "success": False,
            "message": "Failed to update notification"
        }), 500