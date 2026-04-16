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

        # ================= FILE CHECK =================
        if "image" not in request.files:
            return jsonify({"message": "No file provided"}), 400

        file = request.files["image"]

        if file.filename.strip() == "":
            return jsonify({"message": "Empty file name"}), 400

        # ================= FILE TYPE CHECK =================
        allowed_extensions = ["png", "jpg", "jpeg", "webp"]

        if "." not in file.filename:
            return jsonify({"message": "Invalid file name"}), 400

        ext = file.filename.rsplit(".", 1)[1].lower()
        if ext not in allowed_extensions:
            return jsonify({"message": "Invalid file type"}), 400

        # ================= FILE SIZE CHECK (5MB) =================
        file.seek(0, 2)  # move to end
        file_size = file.tell()
        file.seek(0)

        if file_size > 5 * 1024 * 1024:
            return jsonify({"message": "File too large (max 5MB)"}), 400

        # ================= CLOUDINARY UPLOAD =================
        try:
            upload_result = upload_image(file)

            # 🔥 IMPORTANT FIX
            if isinstance(upload_result, dict):
                image_url = upload_result.get("secure_url")
            else:
                image_url = upload_result

        except Exception as e:
            print("CLOUDINARY ERROR:", str(e))
            return jsonify({"message": "Image upload failed"}), 500

        if not image_url:
            return jsonify({"message": "Cloudinary upload failed"}), 500

        print("UPLOADED IMAGE URL:", image_url)

        # ================= FETCH USER =================
        user = db.session.get(User, user_id)  # ✅ modern SQLAlchemy

        if not user:
            return jsonify({"message": "User not found"}), 404

        # ================= SAVE IMAGE =================
        user.profile_image = image_url
        db.session.commit()

        # ================= RESPONSE =================
        return jsonify({
            "message": "Profile image uploaded successfully",
            "user": {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "role": user.role,

                # ✅ MAIN FIELD
                "profile_image": user.profile_image,

                # ✅ fallback (for old frontend)
                "image": user.profile_image
            }
        }), 200

    except Exception as e:
        db.session.rollback()
        print("UPLOAD ERROR:", str(e))
        return jsonify({"message": "Internal server error"}), 500