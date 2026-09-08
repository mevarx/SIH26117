"""
Audio Speech Recognition (ASR) module for Sovereign AI Workbench.
Transcribes spoken audio into text using local models (e.g. Qwen3-ASR-1.7B-GGUF).
"""

import io
import logging
import re
import wave
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
    def remove_wav_silence(audio_bytes: bytes) -> bytes:
        """Use local WebRTC VAD to remove non-speech WAV frames when available."""
        try:
            import webrtcvad
            with wave.open(io.BytesIO(audio_bytes), "rb") as source:
                if source.getnchannels() != 1 or source.getsampwidth() != 2 or source.getframerate() not in (8000, 16000, 32000, 48000):
                    return audio_bytes
                rate, frames = source.getframerate(), source.readframes(source.getnframes())
            frame_length = int(rate * 0.03) * 2
            vad = webrtcvad.Vad(2)
            speech = b"".join(frame for start in range(0, len(frames) - frame_length + 1, frame_length)
                              if vad.is_speech((frame := frames[start:start + frame_length]), rate))
            if not speech:
                return audio_bytes
            output = io.BytesIO()
            with wave.open(output, "wb") as target:
                target.setnchannels(1)
                target.setsampwidth(2)
                target.setframerate(rate)
                target.writeframes(speech)
            return output.getvalue()
        except (ImportError, wave.Error, EOFError):
            return audio_bytes

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
        if suffix == ".wav":
            processed = self.remove_wav_silence(audio_bytes)
            if len(processed) < len(audio_bytes):
                logger.info("VAD isolated speech from %s (%d -> %d bytes)", effective_filename, len(audio_bytes), len(processed))
                audio_bytes = processed

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
