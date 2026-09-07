"""
Unit tests for TaskRouter two-stage intent routing.
"""

import unittest
from app.agent.router import task_router
from app.schemas.tasks import TaskRequest, TaskType


class TestTaskRouter(unittest.TestCase):

    def test_explicit_task_type_honored(self):
        req = TaskRequest(prompt="Hello", task_type=TaskType.RAG)
        self.assertEqual(task_router.route_sync(req), TaskType.RAG)

        req_agent = TaskRequest(prompt="Hello", task_type=TaskType.AGENT)
        self.assertEqual(task_router.route_sync(req_agent), TaskType.AGENT)

    def test_audio_file_heuristic(self):
        for ext in [".wav", ".mp3", ".m4a", ".ogg"]:
            req = TaskRequest(prompt="Transcribe this", file_paths=[f"meeting{ext}"])
            self.assertEqual(task_router.route_sync(req), TaskType.AUDIO)

    def test_vision_file_heuristic(self):
        for ext in [".png", ".jpg", ".jpeg", ".webp"]:
            req = TaskRequest(prompt="Analyze this diagram", file_paths=[f"chart{ext}"])
            self.assertEqual(task_router.route_sync(req), TaskType.VISION)

    def test_document_file_heuristic(self):
        for ext in [".pdf", ".docx", ".txt"]:
            req = TaskRequest(prompt="Summarize this", file_paths=[f"manual{ext}"])
            self.assertEqual(task_router.route_sync(req), TaskType.DOCUMENT)

    def test_sandbox_flag_heuristic(self):
        req = TaskRequest(prompt="Compute fibonacci", sandbox_enabled=True)
        self.assertEqual(task_router.route_sync(req), TaskType.SANDBOX)

    def test_keyword_fallback(self):
        req_rag = TaskRequest(prompt="Search document for password policy")
        self.assertEqual(task_router.route_sync(req_rag), TaskType.RAG)

        req_agent = TaskRequest(prompt="Calculate 15 * 99")
        self.assertEqual(task_router.route_sync(req_agent), TaskType.AGENT)

        req_audio = TaskRequest(prompt="Transcribe the meeting audio record")
        self.assertEqual(task_router.route_sync(req_audio), TaskType.AUDIO)

        req_general = TaskRequest(prompt="Explain the history of cryptography")
        self.assertEqual(task_router.route_sync(req_general), TaskType.GENERAL)


if __name__ == "__main__":
    unittest.main()
