import face_recognition

# Load the images
image1 = face_recognition.load_image_file("person1.jpg")
image2 = face_recognition.load_image_file("person2.jpg")

# Get face encodings (128-d feature vector)
encodings1 = face_recognition.face_encodings(image1)
encodings2 = face_recognition.face_encodings(image2)

# Ensure faces are detected
if len(encodings1) > 0 and len(encodings2) > 0:
    result = face_recognition.compare_faces([encodings1[0]], encodings2[0])
    if result[0]:
        print("✅ Same person")
    else:
        print("❌ Different persons")
else:
    print("⚠️ Could not detect a face in one or both images.")
