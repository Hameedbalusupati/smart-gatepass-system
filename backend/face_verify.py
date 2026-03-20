import face_recognition
import sys

known_path = sys.argv[1]
unknown_path = sys.argv[2]

try:
    known_img = face_recognition.load_image_file(known_path)
    unknown_img = face_recognition.load_image_file(unknown_path)

    known_enc = face_recognition.face_encodings(known_img)[0]
    unknown_enc = face_recognition.face_encodings(unknown_img)[0]

    result = face_recognition.compare_faces([known_enc], unknown_enc)

    if result[0]:
        print("MATCH")
    else:
        print("NO_MATCH")

except:
    print("NO_MATCH")