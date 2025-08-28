# modules/stt_handler.py
import speech_recognition as sr
import os

def transcribe_audio(audio_filepath):
    if not audio_filepath or not os.path.exists(audio_filepath):
        print("STT Error: No audio file provided or file does not exist.")
        return "[Transcription error: Invalid audio file path]"
    
    recognizer = sr.Recognizer()
    try:
        with sr.AudioFile(audio_filepath) as source:
            audio_data = recognizer.record(source)
            print("Transcribing with Whisper...")
            text = recognizer.recognize_whisper(audio_data, language="english")
            print(f"User transcribed as: {text}")
            return text
    except sr.UnknownValueError:
        print("STT Error: Whisper could not understand the audio.")
        return "[Could not understand audio]"
    except sr.RequestError as e:
        print(f"STT Error: Could not request results from Whisper service; {e}")
        return f"[Transcription error: Whisper service issue - {e}]"
    except Exception as e:
        print(f"STT Error: An unexpected error occurred during transcription: {e}")
        return f"[Transcription error: {e}]"
    finally:
        if os.path.exists(audio_filepath):
            try:
                os.remove(audio_filepath)
            except OSError as e:
                print(f"Error deleting temp audio file {audio_filepath}: {e}")