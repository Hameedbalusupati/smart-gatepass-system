from flask import Blueprint, request, jsonify
from database import get_db_connection

notifications_bp = Blueprint("notifications", __name__)

# ---------------- CREATE ----------------
@notifications_bp.route("/notifications", methods=["POST"])
def create_notification():
    data = request.json

    user_email = data.get("user_email")
    message = data.get("message")

    if not user_email or not message:
        return jsonify({"error": "Missing data"}), 400

    conn = get_db_connection()
    cur = conn.cursor()

    try:
        cur.execute("""
            INSERT INTO notifications (user_email, message)
            VALUES (%s, %s)
        """, (user_email, message))

        conn.commit()
        return jsonify({"message": "Notification created successfully"}), 201

    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500

    finally:
        cur.close()
        conn.close()


# ---------------- GET ----------------
@notifications_bp.route("/notifications/<email>", methods=["GET"])
def get_notifications(email):
    conn = get_db_connection()
    cur = conn.cursor()

    try:
        cur.execute("""
            SELECT id, message, is_read, created_at
            FROM notifications
            WHERE user_email = %s
            ORDER BY created_at DESC
        """, (email,))

        rows = cur.fetchall()

        notifications = [
            {
                "id": row[0],
                "message": row[1],
                "is_read": row[2],
                "created_at": row[3]
            }
            for row in rows
        ]

        return jsonify(notifications), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        cur.close()
        conn.close()


# ---------------- MARK AS READ ----------------
@notifications_bp.route("/notifications/read/<int:notification_id>", methods=["PUT"])
def mark_as_read(notification_id):
    conn = get_db_connection()
    cur = conn.cursor()

    try:
        cur.execute("""
            UPDATE notifications
            SET is_read = TRUE
            WHERE id = %s
        """, (notification_id,))

        conn.commit()
        return jsonify({"message": "Marked as read"}), 200

    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500

    finally:
        cur.close()
        conn.close()