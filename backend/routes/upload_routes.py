from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from models import db, User
from utils.cloudinary_config import upload_image

upload_bp = Blueprint("upload", __name__)


# ================= UPLOAD PROFILE IMAGE =================
@upload_bp.route("/upload-profile", methods=["POST"])
@jwt_required()
def upload_profile():
    try:
        # 🔐 Get logged-in user ID from JWT
        user_id = get_jwt_identity()

        # ✅ Check file exists
        if "image" not in request.files:
            return jsonify({"message": "No file provided"}), 400

        file = request.files["image"]

        # ✅ Validate file name
        if file.filename == "":
            return jsonify({"message": "Empty file name"}), 400

        # ☁️ Upload image to Cloudinary
        try:
            image_url = upload_image(file)
        except Exception as e:
            print("CLOUDINARY ERROR:", e)
            return jsonify({"message": "Image upload failed"}), 500

        if not image_url:
            return jsonify({"message": "Cloudinary upload failed"}), 500

        print("UPLOADED IMAGE URL:", image_url)

        # ✅ Fetch user from DB
        user = User.query.get(user_id)

        if not user:
            return jsonify({"message": "User not found"}), 404

        # ✅ Save image URL in DB
        user.profile_image = image_url
        db.session.commit()

        # ✅ Success response (IMPORTANT: consistent key name)
        return jsonify({
            "message": "Profile image uploaded successfully",
            "user": {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "role": user.role,
                "profile_image": user.profile_image   # 🔥 consistent key
            }
        }), 200

    except Exception as e:
        db.session.rollback()
        print("UPLOAD ERROR:", str(e))
        return jsonify({"message": "Internal server error"}), 500