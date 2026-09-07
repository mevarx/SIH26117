"""
Audio Speech Recognition (ASR) module for Sovereign AI Workbench.
Transcribes spoken audio into text using local models (e.g. Qwen3-ASR-1.7B-GGUF).
"""

import io
import logging
import re
from pathlib import Path
from typing import Optional, Union

from app.config import settings
from app.models.registry import model_registry

logger = logging.getLogger(__name__)

AUDIO_EXTENSIONS = {".wav", ".mp3", ".m4a", ".ogg", ".flac", ".aac", ".webm", ".wma"}


class ASRClient:
    """
    Dedicated client for sovereign speech-to-text processing.
    Communicates with local ASR models (Qwen3-ASR) via OpenAI-compatible endpoints.
    """

    def __init__(self, model_id: Optional[str] = None):
        self.model_id = model_id

    def _get_active_model_id(self) -> str:
        return self.model_id or model_registry.get_model_id("asr")

    @staticmethod
    def clean_transcript(raw_text: str) -> str:
        """
        Normalizes Qwen3-ASR output, removing XML tags like <asr_text> and language indicators.
        """
        if not raw_text:
            return ""

        text = raw_text.strip()
        if "<asr_text>" in text:
            text = text.split("<asr_text>", 1)[-1]
        text = text.replace("</asr_text>", "").strip()
        # Remove leading language tags if present (e.g., 'language en', 'language None')
        text = re.sub(r"^language\s+[A-Za-z]+\s*", "", text).strip()
        return text

    async def transcribe(
        self,
        audio_input: Union[bytes, str, Path],
        filename: Optional[str] = None,
        mime_type: Optional[str] = None,
    ) -> str:
        """
        Transcribes audio data (from bytes or a file path) to text.
        """
        model = self._get_active_model_id()
        client = model_registry.get_client("asr", model_id=model)

        if isinstance(audio_input, (str, Path)):
            p = Path(audio_input)
            if not p.is_file():
                raise FileNotFoundError(f"Audio file not found: {audio_input}")
            audio_bytes = p.read_bytes()
            effective_filename = filename or p.name
            suffix = p.suffix.lower()
        else:
            audio_bytes = audio_input
            effective_filename = filename or "audio.wav"
            suffix = Path(effective_filename).suffix.lower()

        effective_mime = mime_type or ("audio/wav" if suffix == ".wav" else f"audio/{suffix.lstrip('.')}")

        try:
            # Use LocalClient transcribe_audio
            raw_text = await client.transcribe_audio(
                audio_bytes=audio_bytes,
                filename=effective_filename,
                mime_type=effective_mime,
                model=model,
            )
            cleaned = self.clean_transcript(raw_text)
            logger.info("ASR transcribed %s (%d bytes) -> %d characters", effective_filename, len(audio_bytes), len(cleaned))
            return cleaned
        except Exception as exc:
            logger.error("ASR transcription failed for %s: %s", effective_filename, exc)
            raise


asr_client = ASRClient()
