import cloudinary
import cloudinary.uploader
import os

# ================= CONFIG =================
cloudinary.config(
    cloud_name=os.environ.get("CLOUDINARY_CLOUD_NAME"),
    api_key=os.environ.get("CLOUDINARY_API_KEY"),
    api_secret=os.environ.get("CLOUDINARY_API_SECRET"),
    secure=True
)

# ================= DEBUG =================
print("===== CLOUDINARY CONFIG =====")
print("CLOUD_NAME:", os.environ.get("CLOUDINARY_CLOUD_NAME"))
print("API_KEY:", os.environ.get("CLOUDINARY_API_KEY"))
print("=============================")


# ================= UPLOAD FUNCTION =================
def upload_image(file):
    try:
        if not file:
            print("❌ No file received")
            return None

        # 🔥 VERY IMPORTANT FIX
        # use file.stream instead of file
        result = cloudinary.uploader.upload(
            file.stream,
            folder="gatepass_students",
            resource_type="image"
        )

        print("✅ UPLOAD SUCCESS:", result.get("secure_url"))

        return result.get("secure_url")

    except Exception as e:
        print("❌ CLOUDINARY FULL ERROR:", repr(e))
        return None