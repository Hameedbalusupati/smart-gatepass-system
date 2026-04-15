import os
from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
from flask_jwt_extended import jwt_required, get_jwt_identity

# ✅ SQLAlchemy
from models import db, User

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
        # 🔐 Get logged-in user id
        user_id = get_jwt_identity()

        # ✅ Validate file
        if "image" not in request.files:
            return jsonify({"error": "No file provided"}), 400

        file = request.files["image"]

        if file.filename == "":
            return jsonify({"error": "No file selected"}), 400

        if not allowed_file(file.filename):
            return jsonify({"error": "Invalid file type"}), 400

        # ✅ Secure filename
        filename = secure_filename(file.filename)

        # 🔥 (Optional but better) unique filename
        filename = f"{user_id}_{filename}"

        # ✅ Create uploads folder
        upload_folder = os.path.join(os.getcwd(), "uploads")
        os.makedirs(upload_folder, exist_ok=True)

        # ✅ Save file
        file_path = os.path.join(upload_folder, filename)
        file.save(file_path)

        # ✅ Get user
        user = User.query.get(user_id)

        if not user:
            return jsonify({"error": "User not found"}), 404

        # 🔥 MAIN FIX (VERY IMPORTANT)
        user.profile_image = filename

        # ✅ Save DB
        db.session.commit()

        # ✅ Response
        return jsonify({
            "message": "Profile image uploaded successfully",
            "user": {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "role": user.role,
                "image": user.profile_image   # 🔥 send correct field
            }
        }), 200

    except Exception as e:
        print("UPLOAD ERROR:", str(e))
        return jsonify({"error": "Internal server error"}), 500