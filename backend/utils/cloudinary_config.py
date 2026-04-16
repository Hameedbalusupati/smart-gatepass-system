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
        # ================= VALIDATION =================
        if not file:
            print("❌ No file received")
            return None

        if file.filename == "":
            print("❌ Empty filename")
            return None

        # ================= RESET POINTER =================
        file.seek(0)

        # ================= UPLOAD =================
        result = cloudinary.uploader.upload(
            file,  # ✅ DO NOT USE file.stream
            folder="gatepass_students",
            resource_type="image",
            overwrite=True
        )

        # ================= RESPONSE CHECK =================
        if not result:
            print("❌ Cloudinary returned empty result")
            return None

        image_url = result.get("secure_url")

        if not image_url:
            print("❌ secure_url missing:", result)
            return None

        print("✅ IMAGE UPLOADED:", image_url)

        return image_url

    except Exception as e:
        print("❌ CLOUDINARY ERROR:", str(e))
        return None