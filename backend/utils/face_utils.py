import cv2
import numpy as np
from PIL import Image
import base64
import io

# Convert base64 image to numpy array
def base64_to_image(base64_string):
    try:
        # Remove header (data:image/jpeg;base64,...)
        if "," in base64_string:
            base64_string = base64_string.split(",")[1]

        img_data = base64.b64decode(base64_string)
        image = Image.open(io.BytesIO(img_data)).convert("RGB")
        return np.array(image)

    except Exception as e:
        print("Base64 conversion error:", e)
        return None


# Encode face (simple method)
def encode_face(image):
    gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
    resized = cv2.resize(gray, (100, 100))
    return resized.flatten()


# MAIN FUNCTION (used in your routes)
def compare_faces(image1_base64, image2_base64):
    try:
        img1 = base64_to_image(image1_base64)
        img2 = base64_to_image(image2_base64)

        if img1 is None or img2 is None:
            return False

        enc1 = encode_face(img1)
        enc2 = encode_face(img2)

        # Euclidean distance
        distance = np.linalg.norm(enc1 - enc2)

        print("Face distance:", distance)

        # Threshold (adjust if needed)
        return distance < 2000

    except Exception as e:
        print("Face compare error:", e)
        return False