"""
Unit tests for Audio Pipeline (ASRClient & AudioMiddleware).
"""

import io
import unittest
from pathlib import Path

from app.audio.asr import ASRClient, asr_client, AUDIO_EXTENSIONS
from app.audio.middleware import AudioMiddleware, audio_middleware


class TestAudioPipeline(unittest.TestCase):

    def test_audio_extensions_coverage(self):
        expected = {".wav", ".mp3", ".m4a", ".ogg", ".flac", ".aac", ".webm"}
        for ext in expected:
            self.assertIn(ext, AUDIO_EXTENSIONS)
            self.assertTrue(audio_middleware.is_audio_path(f"recording{ext}"))

    def test_non_audio_extensions(self):
        non_audio = ["document.pdf", "image.png", "code.py", "archive.zip"]
        for na in non_audio:
            self.assertFalse(audio_middleware.is_audio_path(na))

    def test_clean_transcript_asr_text_tags(self):
        raw = "language en<asr_text>This is a test voice recording.</asr_text>"
        cleaned = ASRClient.clean_transcript(raw)
        self.assertEqual(cleaned, "This is a test voice recording.")

    def test_clean_transcript_no_closing_tag(self):
        raw = "language None<asr_text>Welcome to Sovereign Workbench"
        cleaned = ASRClient.clean_transcript(raw)
        self.assertEqual(cleaned, "Welcome to Sovereign Workbench")

    def test_clean_transcript_empty(self):
        self.assertEqual(ASRClient.clean_transcript(""), "")
        self.assertEqual(ASRClient.clean_transcript("language None<asr_text>"), "")


if __name__ == "__main__":
    unittest.main()
