import cv2
import numpy as np
from PIL import Image
import base64
import io


# ==========================================
# BASE64 → IMAGE
# ==========================================
def base64_to_image(base64_string):
    try:
        if not base64_string:
            return None

        # Remove header if exists
        if "," in base64_string:
            base64_string = base64_string.split(",")[1]

        img_data = base64.b64decode(base64_string)
        image = Image.open(io.BytesIO(img_data)).convert("RGB")

        return np.array(image)

    except Exception as e:
        print("Base64 conversion error:", e)
        return None


# ==========================================
# FACE ENCODING (Improved)
# ==========================================
def encode_face(image):
    try:
        # Convert to grayscale
        gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)

        # Resize for consistency
        resized = cv2.resize(gray, (100, 100))

        # Normalize (IMPORTANT FIX)
        normalized = resized / 255.0

        return normalized.flatten()

    except Exception as e:
        print("Encoding error:", e)
        return None


# ==========================================
# FACE COMPARISON
# ==========================================
def compare_faces(image1_base64, image2_base64):
    try:
        img1 = base64_to_image(image1_base64)
        img2 = base64_to_image(image2_base64)

        if img1 is None or img2 is None:
            return False

        enc1 = encode_face(img1)
        enc2 = encode_face(img2)

        if enc1 is None or enc2 is None:
            return False

        # Euclidean distance
        distance = np.linalg.norm(enc1 - enc2)

        print("Face distance:", distance)

        # 🔥 IMPROVED THRESHOLD
        return distance < 50   # Adjust if needed

    except Exception as e:
        print("Face compare error:", e)
        return False