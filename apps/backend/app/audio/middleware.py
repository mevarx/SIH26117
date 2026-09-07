"""
Audio Pipeline Middleware for Sovereign AI Workbench.

Detects audio attachments in incoming requests, validates file size and format,
transcribes them using local Qwen3-ASR via ASRClient, and formats transcripts
for downstream orchestrator or direct response.
"""

import asyncio
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union

from app.audio.asr import asr_client, AUDIO_EXTENSIONS

logger = logging.getLogger(__name__)

# Max audio file size (e.g. 50MB) to prevent resource exhaustion
MAX_AUDIO_SIZE_BYTES = 50 * 1024 * 1024


class AudioMiddleware:
    """
    Interception middleware that inspects file attachments, extracts audio,
    applies local ASR transcription, and prepares structured text payloads.
    """

    @staticmethod
    def is_audio_path(path: Union[str, Path]) -> bool:
        """Checks if a file path matches supported audio extensions."""
        suffix = Path(path).suffix.lower()
        return suffix in AUDIO_EXTENSIONS

    async def process_attachments(
        self,
        file_paths: List[str],
    ) -> Tuple[List[Dict[str, Any]], List[str]]:
        """
        Detects audio attachments among file_paths and transcribes them.

        Returns:
            Tuple of:
            - audio_transcripts: List of dicts with {"file_path": str, "filename": str, "transcript": str}
            - remaining_non_audio_paths: List of file paths that were not audio
        """
        audio_transcripts: List[Dict[str, Any]] = []
        non_audio_paths: List[str] = []

        for fp in file_paths:
            p = Path(fp)
            if p.is_file() and self.is_audio_path(p):
                file_size = p.stat().st_size
                if file_size > MAX_AUDIO_SIZE_BYTES:
                    logger.warning("Audio file %s exceeds maximum size limit (%d bytes)", p.name, file_size)
                    audio_transcripts.append({
                        "file_path": fp,
                        "filename": p.name,
                        "transcript": f"[Error: Audio file {p.name} exceeds 50MB limit]",
                    })
                    continue

                try:
                    logger.info("Transcribing audio attachment: %s", p.name)
                    transcript = await asr_client.transcribe(p)
                    audio_transcripts.append({
                        "file_path": fp,
                        "filename": p.name,
                        "transcript": transcript,
                    })
                except Exception as exc:
                    logger.error("Failed to transcribe audio attachment %s: %s", p.name, exc)
                    audio_transcripts.append({
                        "file_path": fp,
                        "filename": p.name,
                        "transcript": f"[Audio transcription failed: {str(exc)}]",
                    })
            else:
                non_audio_paths.append(fp)

        return audio_transcripts, non_audio_paths


# Singleton audio middleware instance
audio_middleware = AudioMiddleware()
