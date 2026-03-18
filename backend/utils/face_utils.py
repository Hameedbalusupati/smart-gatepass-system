import face_recognition
import numpy as np


def get_face_encoding(image_file):
    image = face_recognition.load_image_file(image_file)
    encodings = face_recognition.face_encodings(image)

    if len(encodings) == 0:
        return None

    return encodings[0].tolist()


def compare_faces(stored_encoding, image_file):
    image = face_recognition.load_image_file(image_file)
    encodings = face_recognition.face_encodings(image)

    if len(encodings) == 0:
        return False

    captured_encoding = encodings[0]

    result = face_recognition.compare_faces(
        [np.array(stored_encoding)],
        captured_encoding
    )

    return result[0]