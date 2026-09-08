"""Offline language detection and local-translation handoff."""

import re

try:
    from langdetect import detect
except ImportError:  # Optional for constrained air-gapped deployments.
    detect = None


def detect_query_language(text: str) -> str:
    if not text.strip() or detect is None:
        return "en"
    try:
        return detect(text)
    except Exception:
        return "en"


def translation_instruction(text: str, language: str) -> str:
    """Give the local orchestrator an explicit IndicTrans2 translation stage.

    Deployments serving IndicTrans2 should replace this handoff with their local
    model endpoint; no text is sent outside the plant boundary.
    """
    return (
        f"The user query is in '{language}'. First translate it to English using the locally "
        "deployed IndicTrans2 model, then reason over the translation. Preserve the original "
        f"query for the response:\n{text}"
    )
