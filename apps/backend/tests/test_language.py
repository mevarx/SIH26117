import unittest

from app.agent.language import detect_query_language, translation_instruction


class TestLanguageRouting(unittest.TestCase):
    def test_english_is_not_translated(self):
        self.assertEqual(detect_query_language("Check pump P-101 pressure"), "en")

    def test_translation_handoff_preserves_original_query(self):
        instruction = translation_instruction("पंप की जांच करें", "hi")
        self.assertIn("IndicTrans2", instruction)
        self.assertIn("पंप की जांच करें", instruction)
