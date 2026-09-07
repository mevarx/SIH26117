"""
Audio processing package for Sovereign AI Workbench.
"""

from app.audio.asr import ASRClient, asr_client, AUDIO_EXTENSIONS
from app.audio.middleware import AudioMiddleware, audio_middleware

__all__ = ["ASRClient", "asr_client", "AudioMiddleware", "audio_middleware", "AUDIO_EXTENSIONS"]
