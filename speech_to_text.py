import speech_recognition as sr
import pyttsx3
import json
import sys

r = sr.Recognizer()

def SpeakText(command):
    engine = pyttsx3.init()
    engine.say(command)
    engine.runAndWait()

try:
    with sr.Microphone() as source:
        r.adjust_for_ambient_noise(source, duration=0.2)
        audio = r.listen(source)
        text = r.recognize_google(audio).lower()
        SpeakText(text)
        
        # Print JSON only
        sys.stdout.write(json.dumps({"recognized_text": text}))
        sys.stdout.flush()

except sr.RequestError as e:
    sys.stdout.write(json.dumps({"error": f"Request Error: {e}"}))
    sys.stdout.flush()

except sr.UnknownValueError:
    sys.stdout.write(json.dumps({"error": "Speech not recognized"}))
    sys.stdout.flush()
