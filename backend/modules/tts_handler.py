# modules/tts_handler.py
import subprocess
import platform
import sys
import os
import config
from pydub import AudioSegment
import tempfile

def text_to_speech_file(text_to_speak):
    print(f"AI generating audio for: {text_to_speak}")
    piper_executable = 'piper'  # Use system PATH
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".raw") as raw_file:
            raw_filename = raw_file.name

        command = [piper_executable, '--model', config.PIPER_VOICE_MODEL, '--output-file', raw_filename]
        process = subprocess.Popen(command, stdin=subprocess.PIPE)
        process.communicate(input=text_to_speak.encode('utf-8'))

        raw_audio = AudioSegment.from_file(raw_filename, format="raw", frame_rate=22050, channels=1, sample_width=2)

        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as wav_file:
            wav_filename = wav_file.name

        raw_audio.export(wav_filename, format="wav")
        os.remove(raw_filename)
        return wav_filename
    except Exception as e:
        print(f"An error occurred during TTS generation: {e}")
        return None