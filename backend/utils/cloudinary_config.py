import cloudinary
import cloudinary.uploader
import os
from dotenv import load_dotenv

# ================= LOAD ENV =================
load_dotenv()

CLOUD_NAME = os.getenv("CLOUDINARY_CLOUD_NAME")
API_KEY = os.getenv("CLOUDINARY_API_KEY")
API_SECRET = os.getenv("CLOUDINARY_API_SECRET")

# ================= VALIDATION =================
if not CLOUD_NAME or not API_KEY or not API_SECRET:
    raise Exception("Cloudinary credentials not set in .env")

# ================= CONFIG =================
cloudinary.config(
    cloud_name=CLOUD_NAME,
    api_key=API_KEY,
    api_secret=API_SECRET,
    secure=True
)


# ================= UPLOAD FUNCTION =================
def upload_image(file):
    try:
        if not file:
            return None

        result = cloudinary.uploader.upload(
            file,
            folder="gatepass_students",   # better folder name
            resource_type="image",
            transformation=[
                {"width": 500, "height": 500, "crop": "limit"}  # optimize size
            ]
        )

        return result.get("secure_url")

    except Exception as e:
        print("Cloudinary Upload Error:", str(e))
        return None