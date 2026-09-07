"""
Multimodal Vision Pipeline Middleware.

Detects image attachments in requests, sanitizes and optimizes them via Pillow
(preventing decompression bomb attacks, downscaling to 1024px with Lanczos,
compressing to JPEG), and generates base64 data URIs injected into OpenAI-compatible
multimodal content blocks for the Vision Tower.
"""

import asyncio
import base64
import io
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union

from PIL import Image

logger = logging.getLogger(__name__)

# Max pixel threshold to prevent image decompression bomb DoS
Image.MAX_IMAGE_PIXELS = 25_000_000

# Image configuration constants
_MAX_DIMENSION = 1024
_JPEG_QUALITY = 80
_IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp", ".bmp", ".tiff", ".gif"}


class MultimodalVisionMiddleware:
    """
    Interception middleware that inspects file attachments, extracts images,
    applies Pillow optimization, and formats multimodal message payloads.
    """

    @staticmethod
    def is_image_path(path: Union[str, Path]) -> bool:
        """Check if a file path has an image file extension."""
        suffix = Path(path).suffix.lower()
        return suffix in _IMAGE_EXTENSIONS

    @staticmethod
    def _optimize_and_encode_sync(image_bytes: bytes) -> str:
        """
        Synchronous worker for Pillow image optimization:
        - Downscale to max 1024px maintaining aspect ratio
        - Convert mode to RGB (compositing RGBA onto white background)
        - Compress to JPEG quality=80
        - Base64 encode to data URI
        """
        with Image.open(io.BytesIO(image_bytes)) as img:
            # Alpha composite RGBA onto white background if necessary
            if img.mode in ("RGBA", "LA") or (img.mode == "P" and "transparency" in img.info):
                alpha_img = img.convert("RGBA")
                bg = Image.new("RGBA", alpha_img.size, (255, 255, 255, 255))
                img = Image.alpha_composite(bg, alpha_img).convert("RGB")
            elif img.mode != "RGB":
                img = img.convert("RGB")

            width, height = img.size
            if max(width, height) > _MAX_DIMENSION:
                ratio = _MAX_DIMENSION / max(width, height)
                new_size = (int(width * ratio), int(height * ratio))
                img = img.resize(new_size, Image.LANCZOS)
                logger.debug("Resized image from %s to %s", (width, height), new_size)

            buffer = io.BytesIO()
            img.save(buffer, format="JPEG", quality=_JPEG_QUALITY, optimize=True)
            compressed_bytes = buffer.getvalue()

        b64_str = base64.b64encode(compressed_bytes).decode("utf-8")
        return f"data:image/jpeg;base64,{b64_str}"

    async def optimize_and_encode(self, image_bytes: bytes) -> str:
        """Async non-blocking optimization wrapper running in threadpool."""
        return await asyncio.to_thread(self._optimize_and_encode_sync, image_bytes)

    async def process_attachments(
        self,
        file_paths: List[str],
        prompt: str,
    ) -> Tuple[Optional[List[Dict[str, Any]]], List[str]]:
        """
        Detects image attachments among file_paths, optimizes them,
        and constructs multimodal content parts for LLM consumption.

        Returns:
            Tuple of:
            - multimodal_content_parts: List[Dict[str, Any]] or None if no images
            - remaining_non_image_paths: List of file paths that were not images
        """
        image_uris: List[str] = []
        non_image_paths: List[str] = []

        for fp in file_paths:
            p = Path(fp)
            if p.is_file() and self.is_image_path(p):
                try:
                    img_bytes = p.read_bytes()
                    data_uri = await self.optimize_and_encode(img_bytes)
                    image_uris.append(data_uri)
                    logger.info("Vision middleware processed image attachment: %s", p.name)
                except Exception as exc:
                    logger.warning("Could not process image %s: %s", fp, exc)
                    non_image_paths.append(fp)
            else:
                non_image_paths.append(fp)

        if not image_uris:
            return None, non_image_paths

        # Construct OpenAI-compatible multimodal content array
        content_parts: List[Dict[str, Any]] = [{"type": "text", "text": prompt}]
        for uri in image_uris:
            content_parts.append({
                "type": "image_url",
                "image_url": {
                    "url": uri,
                    "detail": "auto",
                },
            })

        return content_parts, non_image_paths

    async def describe_image_attachment(self, file_path: str, instruction: Optional[str] = None) -> str:
        """
        Uses Qwen2.5-VL to inspect an image attachment and return a rich textual description.
        Injected into the text-only orchestrator's context, decoupling vision from reasoning.
        """
        from app.models.base import ChatMessage, GenerationRequest
        from app.models.registry import model_registry

        p = Path(file_path)
        if not p.is_file():
            return f"[Image file not found: {file_path}]"

        try:
            img_bytes = p.read_bytes()
            data_uri = await self.optimize_and_encode(img_bytes)

            prompt_text = instruction or (
                "Analyze and describe this image thoroughly. "
                "Transcribe any visible text, describe charts, diagrams, tables, and visual structure "
                "so that a text reasoning assistant has full understanding of the contents."
            )

            content_parts = [
                {"type": "text", "text": prompt_text},
                {"type": "image_url", "image_url": {"url": data_uri, "detail": "auto"}},
            ]

            vision_client = model_registry.get_client("vision")
            req = GenerationRequest(
                messages=[ChatMessage(role="user", content=content_parts)],
                temperature=0.2,
                max_tokens=1024,
            )
            resp = await vision_client.chat(req)
            return (resp.content or "").strip()
        except Exception as exc:
            logger.error("Failed to describe image attachment %s with Qwen2.5-VL: %s", p.name, exc)
            return f"[Visual inspection failed for {p.name}: {str(exc)}]"


# Singleton vision middleware
vision_middleware = MultimodalVisionMiddleware()
