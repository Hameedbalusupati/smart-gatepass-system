from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from models import db, User

# ✅ Import Cloudinary function
from utils.cloudinary_config import upload_image

upload_bp = Blueprint("upload", __name__)

# ================= UPLOAD PROFILE IMAGE =================
@upload_bp.route("/upload-profile", methods=["POST"])
@jwt_required()
def upload_profile():
    try:
        # 🔐 Get logged-in user id
        user_id = get_jwt_identity()

        # ✅ Validate file
        file = request.files.get("image")

        if not file:
            return jsonify({"error": "No file provided"}), 400

        # ☁️ Upload to Cloudinary
        image_url = upload_image(file)

        if not image_url:
            return jsonify({"error": "Cloudinary upload failed"}), 500

        print("CLOUDINARY URL:", image_url)  # 🔥 debug

        # ✅ Get user
        user = User.query.get(user_id)

        if not user:
            return jsonify({"error": "User not found"}), 404

        # ✅ Save URL in DB
        user.profile_image = image_url
        db.session.commit()

        # ✅ Response
        return jsonify({
            "message": "Profile image uploaded successfully",
            "user": {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "role": user.role,
                "image": user.profile_image
            }
        }), 200

    except Exception as e:
        print("UPLOAD ERROR:", str(e))
        return jsonify({"error": "Internal server error"}), 500