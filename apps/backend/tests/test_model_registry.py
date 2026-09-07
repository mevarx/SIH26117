"""
Unit tests for ModelRegistry multi-model role resolution and client factory.
"""

import unittest
from app.models.registry import model_registry


class TestModelRegistry(unittest.TestCase):

    def setUp(self):
        model_registry.reload()

    def test_role_configs_loaded(self):
        roles = ["orchestrator", "vision", "asr", "router", "orchestrator_fallback"]
        for role in roles:
            cfg = model_registry.get_role_config(role)
            self.assertIsNotNone(cfg, f"Role config for '{role}' should exist")
            self.assertIn("tag", cfg, f"Role '{role}' must specify 'tag'")

    def test_role_aliases(self):
        # 'reasoning' should alias to 'orchestrator'
        reasoning_id = model_registry.get_model_id("reasoning")
        orchestrator_id = model_registry.get_model_id("orchestrator")
        self.assertEqual(reasoning_id, orchestrator_id)

        # 'audio' should alias to 'asr'
        audio_id = model_registry.get_model_id("audio")
        asr_id = model_registry.get_model_id("asr")
        self.assertEqual(audio_id, asr_id)

    def test_role_model_ids(self):
        orch_id = model_registry.get_model_id("orchestrator")
        self.assertIn("Ling-3.0-tiny", orch_id)

        vision_id = model_registry.get_model_id("vision")
        self.assertIn("Qwen2.5-VL", vision_id)

        asr_id = model_registry.get_model_id("asr")
        self.assertIn("Qwen3-ASR", asr_id)

        router_id = model_registry.get_model_id("router")
        self.assertIn("Ling-3.0-tiny-GGUF:IQ2_M", router_id)

        fallback_id = model_registry.get_model_id("orchestrator_fallback")
        self.assertIn("ornith", fallback_id.lower())

    def test_get_client_caching(self):
        client1 = model_registry.get_client("orchestrator")
        client2 = model_registry.get_client("orchestrator")
        self.assertIs(client1, client2, "Clients for the same role should be cached")

        vision_client = model_registry.get_client("vision")
        self.assertIsNot(client1, vision_client, "Different roles should yield separate clients")


if __name__ == "__main__":
    unittest.main()
