"""
Task intent router for Sovereign AI Workbench.

Analyzes TaskRequest parameters and intent to determine the appropriate execution pipeline:
1. Fast heuristic dispatch (explicit type, file extensions, sandbox toggle)
2. Fast router pre-classification using Ling-3.0-tiny (IQ2_M)
3. Deterministic keyword fallback for reliability
"""

import asyncio
import logging
import re
from pathlib import Path
from typing import List, Optional

from app.audio.asr import AUDIO_EXTENSIONS
from app.models.base import ChatMessage, GenerationRequest
from app.models.registry import model_registry
from app.schemas.tasks import TaskRequest, TaskType

logger = logging.getLogger(__name__)

IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp", ".bmp", ".tiff", ".gif"}
DOC_EXTENSIONS = {".pdf", ".docx", ".doc", ".txt", ".md", ".csv", ".json"}

ROUTER_SYSTEM_PROMPT = """You are a fast intent classifier for a sovereign AI system.
Classify the user input into exactly ONE of the following categories:
- general: General conversation, factual Q&A, writing, analysis.
- rag: Search in knowledge base, find internal documents, document retrieval.
- agent: Multi-step reasoning, mathematical calculations, complex planning, tool use.
- vision: Image analysis, diagram reading, visual queries.
- audio: Voice memo transcription, speech analysis, audio queries.
- sandbox: Executing Python code, evaluating scripts in a secure runner.

Respond with ONLY the category name.
"""


class TaskRouter:
    """Routes incoming tasks to appropriate specialized engines or agent loops."""

    @staticmethod
    def _check_heuristics(task: TaskRequest) -> Optional[TaskType]:
        """Fast synchronous heuristic checks for explicit task types and attachments."""
        if task.task_type and task.task_type != TaskType.GENERAL:
            return task.task_type

        if task.sandbox_enabled:
            return TaskType.SANDBOX

        # Inspect candidate attachment paths
        candidate_paths: List[str] = list(task.file_paths)
        if task.attachment_path and task.attachment_path not in candidate_paths:
            candidate_paths.append(task.attachment_path)

        for fp in candidate_paths:
            suffix = Path(fp).suffix.lower()
            if suffix in AUDIO_EXTENSIONS:
                return TaskType.AUDIO
            if suffix in IMAGE_EXTENSIONS:
                return TaskType.VISION
            if suffix in DOC_EXTENSIONS:
                return TaskType.DOCUMENT

        return None

    @staticmethod
    def _fallback_keyword_classification(prompt: str) -> TaskType:
        """Deterministic keyword heuristic fallback when router model is unavailable or ambiguous."""
        p_lower = prompt.lower()

        if any(w in p_lower for w in ["search document", "search kb", "rag", "find in document", "knowledge base"]):
            return TaskType.RAG

        if any(w in p_lower for w in ["calculate", "solve", "execute", "run code", "write a program", "plan and execute"]):
            return TaskType.AGENT

        if any(w in p_lower for w in ["transcribe", "speech", "voice memo", "audio record"]):
            return TaskType.AUDIO

        if any(w in p_lower for w in ["what is in this image", "diagram analysis", "picture", "screenshot"]):
            return TaskType.VISION

        return TaskType.GENERAL

    async def classify_intent_with_model(self, prompt: str) -> Optional[TaskType]:
        """
        Uses Ling-3.0-tiny (IQ2_M) as a fast pre-classifier.
        Extracts classification prioritizing content over ambient reasoning words.
        """
        try:
            client = model_registry.get_client("router")
            req = GenerationRequest(
                system_prompt=ROUTER_SYSTEM_PROMPT,
                prompt=prompt,
                temperature=0.0,
                max_tokens=80,
            )
            resp = await asyncio.wait_for(client.chat(req), timeout=8.0)

            # 1. Check explicit content first
            content_clean = (resp.content or "").strip().lower()
            for candidate_type in [TaskType.SANDBOX, TaskType.AUDIO, TaskType.VISION, TaskType.RAG, TaskType.AGENT, TaskType.GENERAL]:
                if re.search(rf"\b{candidate_type.value}\b", content_clean):
                    logger.info("Router pre-classified prompt via content: %s", candidate_type.value)
                    return candidate_type

            # 2. Check reasoning trace if content was empty
            reasoning_clean = (resp.reasoning_content or "").strip().lower()
            if reasoning_clean:
                # Look specifically for category indicators or specific types (exclude ambient 'general' unless explicit)
                for candidate_type in [TaskType.SANDBOX, TaskType.AUDIO, TaskType.VISION, TaskType.RAG, TaskType.AGENT]:
                    if re.search(rf"\b(?:category|classify|type|is|as)?\s*:?\s*{candidate_type.value}\b", reasoning_clean):
                        logger.info("Router pre-classified prompt via reasoning: %s", candidate_type.value)
                        return candidate_type

        except Exception as exc:
            logger.debug("Router model pre-classification bypassed: %s", exc)

        return None

    async def route(self, task: TaskRequest) -> TaskType:
        """
        Two-stage routing:
        1. Explicit task_type and file attachments heuristic check
        2. Fast router model pre-classification (Ling-3.0-tiny IQ2_M)
        3. Deterministic keyword fallback
        """
        heuristic_intent = self._check_heuristics(task)
        if heuristic_intent is not None:
            return heuristic_intent

        # Fast model-based pre-classification
        model_intent = await self.classify_intent_with_model(task.prompt)
        if model_intent is not None:
            return model_intent

        # Final keyword fallback
        return self._fallback_keyword_classification(task.prompt)

    def route_sync(self, task: TaskRequest) -> TaskType:
        """Synchronous routing for controllers not running inside an async loop."""
        heuristic = self._check_heuristics(task)
        if heuristic is not None:
            return heuristic
        return self._fallback_keyword_classification(task.prompt)


task_router = TaskRouter()
