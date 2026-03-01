from flask import Blueprint, request, jsonify
from database import get_db_connection

notifications_bp = Blueprint("notifications", __name__)

# ----------------------------------------
# CREATE NOTIFICATION
# ----------------------------------------
@notifications_bp.route("/notifications", methods=["POST"])
def create_notification():
    data = request.json
    user_email = data.get("user_email")
    message = data.get("message")

    if not user_email or not message:
        return jsonify({"error": "Missing data"}), 400

    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("""
        INSERT INTO notifications (user_email, message)
        VALUES (%s, %s)
    """, (user_email, message))

    conn.commit()
    cur.close()
    conn.close()

    return jsonify({"message": "Notification created successfully"})


# ----------------------------------------
# GET USER NOTIFICATIONS
# ----------------------------------------
@notifications_bp.route("/notifications/<email>", methods=["GET"])
def get_notifications(email):
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT id, message, is_read, created_at
        FROM notifications
        WHERE user_email = %s
        ORDER BY created_at DESC
    """, (email,))

    rows = cur.fetchall()

    notifications = []
    for row in rows:
        notifications.append({
            "id": row[0],
            "message": row[1],
            "is_read": row[2],
            "created_at": row[3]
        })

    cur.close()
    conn.close()

    return jsonify(notifications)


# ----------------------------------------
# MARK AS READ
# ----------------------------------------
@notifications_bp.route("/notifications/read/<int:notification_id>", methods=["PUT"])
def mark_as_read(notification_id):
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("""
        UPDATE notifications
        SET is_read = TRUE
        WHERE id = %s
    """, (notification_id,))

    conn.commit()
    cur.close()
    conn.close()

    return jsonify({"message": "Marked as read"})