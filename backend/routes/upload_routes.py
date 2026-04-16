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
        # 🔐 Get logged-in user ID
        user_id = get_jwt_identity()

        # ✅ Check file exists
        if "image" not in request.files:
            return jsonify({"message": "No file provided"}), 400

        file = request.files["image"]

        # ✅ Validate filename
        if file.filename.strip() == "":
            return jsonify({"message": "Empty file name"}), 400

        # ✅ Optional: validate file type
        allowed_extensions = ["png", "jpg", "jpeg", "webp"]
        if "." in file.filename:
            ext = file.filename.rsplit(".", 1)[1].lower()
            if ext not in allowed_extensions:
                return jsonify({"message": "Invalid file type"}), 400

        # ☁️ Upload to Cloudinary
        try:
            image_url = upload_image(file)
        except Exception as e:
            print("CLOUDINARY ERROR:", str(e))
            return jsonify({"message": "Image upload failed"}), 500

        if not image_url:
            return jsonify({"message": "Cloudinary upload failed"}), 500

        print("UPLOADED IMAGE URL:", image_url)

        # ✅ Fetch user
        user = User.query.get(user_id)

        if not user:
            return jsonify({"message": "User not found"}), 404

        # ✅ Save image in DB
        user.profile_image = image_url
        db.session.commit()

        # 🔥 IMPORTANT: send BOTH keys (to avoid frontend bugs)
        return jsonify({
            "message": "Profile image uploaded successfully",
            "user": {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "role": user.role,

                # ✅ MAIN FIELD
                "profile_image": user.profile_image,

                # ✅ BACKWARD COMPATIBILITY (VERY IMPORTANT 🔥)
                "image": user.profile_image
            }
        }), 200

    except Exception as e:
        db.session.rollback()
        print("UPLOAD ERROR:", str(e))
        return jsonify({"message": "Internal server error"}), 500