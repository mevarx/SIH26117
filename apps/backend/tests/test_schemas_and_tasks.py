"""
Unit tests for Task schemas and TaskType.AUDIO support.
"""

import unittest
from app.schemas.tasks import TaskRequest, TaskResponse, TaskStatus, TaskType


class TestSchemasAndTasks(unittest.TestCase):

    def test_task_type_audio_enum(self):
        self.assertEqual(TaskType.AUDIO.value, "audio")
        self.assertIn("audio", [t.value for t in TaskType])

    def test_task_request_with_audio(self):
        req = TaskRequest(
            prompt="Transcribe recorded speech",
            task_type=TaskType.AUDIO,
            file_paths=["audio.wav"],
        )
        self.assertEqual(req.task_type, TaskType.AUDIO)
        dump = req.model_dump()
        self.assertEqual(dump["task_type"], "audio")

    def test_task_response_with_audio(self):
        resp = TaskResponse(
            task_type=TaskType.AUDIO,
            prompt="Transcribe audio",
            status=TaskStatus.COMPLETED,
            result="Speech transcription output",
        )
        self.assertEqual(resp.task_type, TaskType.AUDIO)
        self.assertEqual(resp.status, TaskStatus.COMPLETED)
        json_str = resp.model_dump_json()
        self.assertIn('"task_type":"audio"', json_str)


if __name__ == "__main__":
    unittest.main()
