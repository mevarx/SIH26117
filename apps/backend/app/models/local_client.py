import json
import logging
import re
from typing import Any, AsyncIterator, Dict, List, Optional, Tuple
import httpx

from app.config import settings
from app.models.base import (
    BaseModelClient,
    ChatMessage,
    GenerationRequest,
    GenerationResponse,
)

logger = logging.getLogger(__name__)


class LocalClient(BaseModelClient):
    """
    High-performance, OpenAI-compatible local model client.
    Maintains a persistent connection pool supporting Ollama (/v1), vLLM, and MLX (LM Studio/mlx-lm).
    """

    def __init__(
        self,
        base_url: Optional[str] = None,
        default_model: Optional[str] = None,
        timeout: Optional[float] = None,
        client: Optional[httpx.AsyncClient] = None,
    ):
        self.base_url = (base_url or settings.active_model_endpoint).rstrip("/")
        self.default_model = default_model or settings.active_model_name
        self.timeout = timeout or settings.active_timeout_seconds
        self._external_client = client is not None
        self._client = client or httpx.AsyncClient(
            timeout=self.timeout,
            limits=httpx.Limits(max_keepalive_connections=20, max_connections=50),
        )

    async def aclose(self) -> None:
        """Closes the underlying HTTP connection pool if owned by this client."""
        if not self._external_client and not self._client.is_closed:
            await self._client.aclose()

    async def __aenter__(self) -> "LocalClient":
        return self

    async def __aexit__(self, exc_type: Any, exc_val: Any, exc_tb: Any) -> None:
        await self.aclose()

    def _format_messages(self, messages: List[ChatMessage], prompt: Optional[str] = None) -> List[Dict[str, Any]]:
        formatted: List[Dict[str, Any]] = []
        if prompt and not messages:
            formatted.append({"role": "user", "content": prompt})
        for msg in messages:
            item: Dict[str, Any] = {"role": msg.role, "content": msg.content}
            if msg.name:
                item["name"] = msg.name
            if msg.tool_calls:
                item["tool_calls"] = msg.tool_calls
            if msg.tool_call_id:
                item["tool_call_id"] = msg.tool_call_id
            formatted.append(item)
        return formatted

    @staticmethod
    def _extract_reasoning(content: str, raw_reasoning: Optional[str] = None) -> Tuple[str, Optional[str]]:
        """
        Extracts reasoning traces from models emitting either:
          1. Dedicated reasoning_content field (vLLM / Qwen reasoning parser)
          2. Explicit <think>...</think> tags embedded in the message content
        """
        if raw_reasoning:
            return content, raw_reasoning

        if not content:
            return "", None

        think_match = re.search(r"<think>(.*?)</think>", content, flags=re.DOTALL)
        if think_match:
            reasoning = think_match.group(1).strip()
            clean_content = re.sub(r"<think>.*?</think>", "", content, flags=re.DOTALL).strip()
            return clean_content, reasoning

        return content, None

    async def chat(self, request: GenerationRequest) -> GenerationResponse:
        model = request.model or self.default_model
        messages = self._format_messages(request.messages, request.prompt)

        payload: Dict[str, Any] = {
            "model": model,
            "messages": messages,
            "temperature": request.temperature,
            "stream": False,
        }
        if request.max_tokens is not None:
            payload["max_tokens"] = request.max_tokens
        if request.top_p is not None:
            payload["top_p"] = request.top_p
        if request.tools:
            payload["tools"] = request.tools
        if request.tool_choice:
            payload["tool_choice"] = request.tool_choice
        if request.extra_body:
            payload.update(request.extra_body)

        endpoint = f"{self.base_url}/chat/completions"
        try:
            response = await self._client.post(endpoint, json=payload)
            response.raise_for_status()
            data = response.json()
        except httpx.HTTPError as exc:
            logger.error("LocalClient chat request failed against %s: %s", endpoint, exc)
            raise

        choices = data.get("choices", [])
        if not choices:
            return GenerationResponse(model=model, raw_response=data)

        choice = choices[0]
        message_data = choice.get("message", {})
        raw_content = message_data.get("content", "") or ""
        raw_reasoning = message_data.get("reasoning_content") or message_data.get("reasoning")

        content, reasoning = self._extract_reasoning(raw_content, raw_reasoning)
        if not content and reasoning and not message_data.get("tool_calls"):
            content = reasoning

        return GenerationResponse(
            content=content,
            reasoning_content=reasoning,
            tool_calls=message_data.get("tool_calls"),
            finish_reason=choice.get("finish_reason"),
            model=data.get("model", model),
            usage=data.get("usage"),
            raw_response=data,
        )

    async def stream_chat(self, request: GenerationRequest) -> AsyncIterator[str]:
        model = request.model or self.default_model
        messages = self._format_messages(request.messages, request.prompt)

        payload: Dict[str, Any] = {
            "model": model,
            "messages": messages,
            "temperature": request.temperature,
            "stream": True,
        }
        if request.max_tokens is not None:
            payload["max_tokens"] = request.max_tokens
        if request.top_p is not None:
            payload["top_p"] = request.top_p

        endpoint = f"{self.base_url}/chat/completions"
        try:
            async with self._client.stream("POST", endpoint, json=payload) as response:
                response.raise_for_status()
                async for line in response.aiter_lines():
                    if not line or not line.startswith("data: "):
                        continue
                    data_str = line[6:].strip()
                    if data_str == "[DONE]":
                        break
                    try:
                        chunk = json.loads(data_str)
                        delta = chunk.get("choices", [{}])[0].get("delta", {})
                        delta_text = delta.get("content", "")
                        if delta_text:
                            yield delta_text
                    except json.JSONDecodeError:
                        logger.warning("Failed to decode SSE chunk: %s", data_str)
                        continue
        except httpx.HTTPError as exc:
            logger.error("LocalClient streaming failed against %s: %s", endpoint, exc)
            raise

    async def embeddings(self, texts: List[str], model: Optional[str] = None) -> List[List[float]]:
        target_model = model or settings.default_embedding_model
        endpoint = f"{self.base_url}/embeddings"

        payload = {
            "model": target_model,
            "input": texts,
        }

        response = await self._client.post(endpoint, json=payload)
        response.raise_for_status()
        data = response.json()

        items = sorted(data.get("data", []), key=lambda x: x.get("index", 0))
        return [item["embedding"] for item in items if "embedding" in item]

    async def transcribe_audio(
        self,
        audio_bytes: bytes,
        filename: str = "audio.wav",
        mime_type: str = "audio/wav",
        model: Optional[str] = None,
    ) -> str:
        """
        Transcribes audio using local ASR model (e.g., Qwen3-ASR) via OpenAI-compatible endpoint.
        Tries /v1/audio/transcriptions multipart upload first, falling back to input_audio chat format.
        """
        target_model = model or settings.asr_model
        endpoint = f"{self.base_url}/audio/transcriptions"
        try:
            files = {"file": (filename, audio_bytes, mime_type)}
            data = {"model": target_model}
            resp = await self._client.post(endpoint, files=files, data=data, timeout=60.0)
            if resp.status_code == 200:
                text = resp.json().get("text", "")
                if "<asr_text>" in text:
                    text = text.split("<asr_text>", 1)[-1]
                return text.replace("</asr_text>", "").strip()
        except Exception as exc:
            logger.debug("Ollama /v1/audio/transcriptions failed: %s; trying chat input_audio fallback", exc)

        # Fallback: chat completions with base64 input_audio
        import base64
        b64_audio = base64.b64encode(audio_bytes).decode("utf-8")
        fmt = filename.split(".")[-1].lower() if "." in filename else "wav"
        if fmt not in ("wav", "mp3"):
            fmt = "wav"
        payload = {
            "model": target_model,
            "messages": [{
                "role": "user",
                "content": [
                    {"type": "input_audio", "input_audio": {"data": b64_audio, "format": fmt}}
                ]
            }],
            "max_tokens": 512,
        }
        resp = await self._client.post(f"{self.base_url}/chat/completions", json=payload, timeout=60.0)
        resp.raise_for_status()
        raw_text = resp.json()["choices"][0]["message"].get("content", "")
        if "<asr_text>" in raw_text:
            raw_text = raw_text.split("<asr_text>", 1)[-1]
        return raw_text.replace("</asr_text>", "").strip()

    async def health_check(self) -> bool:
        """Verifies connection to the local OpenAI-compatible endpoint."""
        try:
            endpoint = f"{self.base_url}/models"
            resp = await self._client.get(endpoint, timeout=5.0)
            return resp.status_code == 200
        except Exception as exc:
            logger.debug("Health check failed for %s: %s", self.base_url, exc)
            return False
