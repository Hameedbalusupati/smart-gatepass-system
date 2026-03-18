from deepface import DeepFace
import tempfile
import os


# ================= SAVE TEMP IMAGE =================
def save_temp_file(file):
    temp = tempfile.NamedTemporaryFile(delete=False, suffix=".jpg")
    file.save(temp.name)
    return temp.name


# ================= GET FACE (STORE IMAGE PATH) =================
def get_face_encoding(image_file):
    """
    Instead of encoding, we store the image path
    (DeepFace compares images directly)
    """
    path = save_temp_file(image_file)
    return path


# ================= COMPARE FACES =================
def compare_faces(stored_image_path, captured_file):

    try:
        captured_path = save_temp_file(captured_file)

        result = DeepFace.verify(
            img1_path=stored_image_path,
            img2_path=captured_path,
            enforce_detection=False
        )

        # cleanup temp file
        os.remove(captured_path)

        return result["verified"]

    except Exception as e:
        print("FACE ERROR:", e)
        return False