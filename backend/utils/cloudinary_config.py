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

# 🔥 DEBUG (optional but useful)
print("Cloudinary Config Loaded:")
print("CLOUD_NAME:", os.environ.get("CLOUDINARY_CLOUD_NAME"))
print("API_KEY:", os.environ.get("CLOUDINARY_API_KEY"))


# ================= UPLOAD FUNCTION =================
def upload_image(file):
    try:
        if not file:
            print("No file received")
            return None

        # ☁️ Upload to Cloudinary
        result = cloudinary.uploader.upload(
            file,
            folder="gatepass_students",
            resource_type="image",
            transformation=[
                {"width": 500, "height": 500, "crop": "limit"}
            ]
        )

        print("UPLOAD SUCCESS:", result)

        # ✅ Return image URL
        return result.get("secure_url")

    except Exception as e:
        print("Cloudinary Upload Error:", str(e))
        return None