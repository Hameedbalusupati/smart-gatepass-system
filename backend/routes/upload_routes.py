import os
from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename
from flask_jwt_extended import jwt_required, get_jwt_identity
from database import get_db_connection

upload_bp = Blueprint("upload", __name__)

# ✅ Allowed extensions
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif"}

# ✅ Check file type
def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


# ================= UPLOAD PROFILE IMAGE =================
@upload_bp.route("/upload-profile", methods=["POST"])
@jwt_required()
def upload_profile():
    try:
        # 🔐 Get logged-in user id from token
        user_id = get_jwt_identity()

        if "image" not in request.files:
            return jsonify({"error": "No file provided"}), 400

        file = request.files["image"]

        if file.filename == "":
            return jsonify({"error": "No file selected"}), 400

        if not allowed_file(file.filename):
            return jsonify({"error": "Invalid file type"}), 400

        # ✅ Secure filename
        filename = secure_filename(file.filename)

        # ✅ Ensure uploads folder exists
        upload_folder = os.path.join(os.getcwd(), "uploads")
        os.makedirs(upload_folder, exist_ok=True)

        # ✅ Save file
        file_path = os.path.join(upload_folder, filename)
        file.save(file_path)

        # ✅ Save path to DB
        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute(
            """
            UPDATE users
            SET image = %s
            WHERE id = %s
            RETURNING id, name, email, role, image
            """,
            (filename, user_id)
        )

        updated_user = cur.fetchone()
        conn.commit()

        cur.close()
        conn.close()

        if not updated_user:
            return jsonify({"error": "User not found"}), 404

        # ✅ Response
        return jsonify({
            "message": "Profile image uploaded successfully",
            "user": {
                "id": updated_user[0],
                "name": updated_user[1],
                "email": updated_user[2],
                "role": updated_user[3],
                "image": updated_user[4]
            }
        }), 200

    except Exception as e:
        print("UPLOAD ERROR:", str(e))
        return jsonify({"error": "Internal server error"}), 500