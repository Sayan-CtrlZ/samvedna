"""Comprehensive Automated Test Suite for SAMVEDNA AI Conversational Pipeline.

Validates the full multimodal pipeline:
  Text Analysis (Primary Semantic Signal)
  + Voice Analysis (Secondary Prosodic Refinement)
  -> Multimodal Fusion (Final User State)
  -> Groq LLM / Response Context
  -> Contextual Appropriate Response
"""
import os
import sys
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "backend"))

from app.services.nlp_engine import nlp_engine
from app.services.voice_analytics import voice_engine
from app.services.multimodal_fusion import multimodal_fusion_engine
from app.services.llm_service import llm_engine


class ConversationalPipelineTests(unittest.TestCase):
    def get_fused_state(self, text: str, voice: dict = None, lang: str = "en") -> dict:
        nlp_res = nlp_engine.analyze_text(text, lang)
        return multimodal_fusion_engine.interpret(nlp_res, voice or {})

    def get_response(self, text: str, voice: dict = None, lang: str = "en") -> tuple:
        state = self.get_fused_state(text, voice, lang)
        resp = llm_engine.generate_contextual_response(
            session_id=f"TEST-{self._testMethodName}-{lang}",
            user_message=text,
            emotional_state=state,
            voice_analysis=voice or {},
            legal_context={"legal_stage": "Special Court Trial", "accused_on_bail": False, "district": "District"},
            language=lang
        )
        return state, resp

    # =========================================================================
    # CORE TEST CASES (1 to 10)
    # =========================================================================

    def test_01_greeting_hi(self):
        """TEST 1: Input: 'Hi' -> intent=greeting, distress=none, response_mode=casual"""
        state, resp = self.get_response("Hi")
        self.assertEqual(state["intent"], "greeting")
        self.assertEqual(state["distress_level"], "none")
        self.assertEqual(state["response_mode"], "casual")
        # Ensure no crisis language is manufactured
        self.assertNotIn("14566", resp)
        self.assertNotIn("112", resp)
        self.assertNotIn("police", resp.lower())

    def test_02_greeting_hello(self):
        """TEST 2: Input: 'Hello!' -> casual/greeting, NOT distress"""
        state, resp = self.get_response("Hello!")
        self.assertEqual(state["intent"], "greeting")
        self.assertEqual(state["distress_level"], "none")
        self.assertEqual(state["response_mode"], "casual")
        self.assertNotIn("14566", resp)
        self.assertNotIn("distress", resp.lower())

    def test_03_positive_happy_today(self):
        """TEST 3: Input: 'I\'m so happy today!' -> valence=positive, emotion=happiness/joy, distress=none, response_mode=positive"""
        state, resp = self.get_response("I'm so happy today!")
        self.assertEqual(state["valence"], "positive")
        self.assertEqual(state["emotion"], "happiness/joy")
        self.assertEqual(state["distress_level"], "none")
        self.assertEqual(state["response_mode"], "positive")
        self.assertNotIn("14566", resp)
        self.assertNotIn("crisis", resp.lower())

    def test_04_positive_excited_tomorrow(self):
        """TEST 4: Input: 'I\'m really excited about tomorrow!' -> positive, excitement, high arousal acceptable, NOT distress"""
        state, resp = self.get_response("I'm really excited about tomorrow!")
        self.assertEqual(state["valence"], "positive")
        self.assertEqual(state["emotion"], "excitement")
        self.assertEqual(state["distress_level"], "none")
        self.assertEqual(state["response_mode"], "positive")
        self.assertEqual(state["arousal"], "high")
        self.assertNotIn("14566", resp)

    def test_05_positive_everything_great(self):
        """TEST 5: Input: 'Everything is going great!' -> positive, NOT distress"""
        state, resp = self.get_response("Everything is going great!")
        self.assertEqual(state["valence"], "positive")
        self.assertEqual(state["distress_level"], "none")
        self.assertEqual(state["response_mode"], "positive")
        self.assertNotIn("14566", resp)

    def test_06_worry_about_exam(self):
        """TEST 6: Input: 'I\'m worried about my exam.' -> negative, worry/anxiety, appropriate supportive response"""
        state, resp = self.get_response("I'm worried about my exam.")
        self.assertEqual(state["valence"], "negative")
        self.assertEqual(state["emotion"], "stress/anxiety")
        self.assertIn(state["distress_level"], ["low", "moderate"])
        self.assertEqual(state["response_mode"], "supportive")
        # Supportive response should validate and calm without claiming severe atrocity/crisis
        self.assertNotIn("112", resp)
        self.assertTrue(any(w in resp.lower() for w in ["exam", "step", "breath", "worry", "natural", "prepared"]))

    def test_07_distress_overwhelmed(self):
        """TEST 7: Input: 'I feel overwhelmed and I don't know what to do.' -> negative, distress/support-seeking, supportive response"""
        state, resp = self.get_response("I feel overwhelmed and I don't know what to do.")
        self.assertEqual(state["valence"], "negative")
        self.assertEqual(state["intent"], "distress_support_seeking")
        self.assertIn(state["response_mode"], ["supportive", "distress_support"])
        # Should offer empathetic grounding
        self.assertTrue(len(resp) > 20)

    def test_08_danger_scared_not_safe(self):
        """TEST 8: Input: 'I\'m scared and I don't feel safe.' -> high concern/distress, appropriate safety-oriented response"""
        state, resp = self.get_response("I'm scared and I don't feel safe.")
        self.assertEqual(state["distress_level"], "high")
        self.assertEqual(state["response_mode"], "distress_support")
        # High distress / safety concern should provide safety guidance and helpline numbers
        self.assertTrue("14566" in resp or "112" in resp or "safety" in resp.lower() or "protection" in resp.lower())

    def test_09_info_seeking_fastapi(self):
        """TEST 9: Input: 'Tell me what FastAPI is.' -> information-seeking, neutral, normal informative response, NOT emotional empathy"""
        state, resp = self.get_response("Tell me what FastAPI is.")
        self.assertEqual(state["intent"], "information_seeking")
        self.assertEqual(state["valence"], "neutral")
        self.assertEqual(state["distress_level"], "none")
        self.assertEqual(state["response_mode"], "neutral")
        # Must be informative without crisis empathy
        self.assertNotIn("14566", resp)
        self.assertNotIn("sorry to hear", resp.lower())
        self.assertNotIn("your pain", resp.lower())
        self.assertTrue("framework" in resp.lower() or "api" in resp.lower() or "python" in resp.lower())

    def test_10_gratitude_thanks_helped(self):
        """TEST 10: Input: 'Thanks, that helped!' -> positive/gratitude, normal friendly response, NOT distress"""
        state, resp = self.get_response("Thanks, that helped!")
        self.assertEqual(state["valence"], "positive")
        self.assertEqual(state["distress_level"], "none")
        self.assertIn(state["response_mode"], ["casual", "positive"])
        self.assertNotIn("14566", resp)
        self.assertNotIn("112", resp)

    # =========================================================================
    # VOICE ANALYSIS & MULTIMODAL FUSION TESTS
    # =========================================================================

    def test_voice_01_positive_text_high_arousal_voice(self):
        """Positive text + high arousal voice -> positive/excitement, NOT stress"""
        high_arousal_voice = {
            "has_audio": True,
            "valence": "UNCERTAIN",
            "voice_valence": "uncertain",
            "arousal": "high",
            "voice_confidence": 0.45,
            "vocal_tension": 22.0,
            "acoustic_stress_score": 22.0,
            "vocal_stability": "Stable"
        }
        state = self.get_fused_state("I am so excited!", high_arousal_voice)
        self.assertEqual(state["valence"], "positive")
        self.assertEqual(state["emotion"], "excitement")
        self.assertEqual(state["arousal"], "high")
        self.assertEqual(state["distress_level"], "none")
        self.assertEqual(state["response_mode"], "positive")

    def test_voice_02_neutral_text_uncertain_voice(self):
        """Neutral text + uncertain voice -> neutral/uncertain, NOT distress"""
        uncertain_voice = {
            "has_audio": True,
            "valence": "UNCERTAIN",
            "voice_valence": "uncertain",
            "arousal": "medium",
            "voice_confidence": 0.40,
            "vocal_tension": 25.0,
            "acoustic_stress_score": 25.0,
            "vocal_stability": "Stable"
        }
        state = self.get_fused_state("Everything is normal today.", uncertain_voice)
        self.assertEqual(state["valence"], "neutral")
        self.assertEqual(state["distress_level"], "none")
        self.assertEqual(state["response_mode"], "neutral")

    def test_voice_03_distressed_text_tense_voice(self):
        """Negative/distressed text + negative/tense voice -> stronger distress confidence"""
        tense_voice = {
            "has_audio": True,
            "valence": "NEGATIVE",
            "voice_valence": "negative",
            "arousal": "high",
            "voice_confidence": 0.75,
            "vocal_tension": 72.0,
            "acoustic_stress_score": 72.0,
            "vocal_stability": "Unstable / Trembling"
        }
        state_text_only = self.get_fused_state("I feel overwhelmed and I don't know what to do.")
        state_with_voice = self.get_fused_state("I feel overwhelmed and I don't know what to do.", tense_voice)
        self.assertEqual(state_with_voice["valence"], "negative")
        self.assertGreaterEqual(state_with_voice["confidence"], state_text_only["confidence"])

    def test_voice_04_positive_text_uncertain_voice(self):
        """Positive text + uncertain voice -> positive text interpretation remains dominant"""
        uncertain_voice = {
            "has_audio": True,
            "valence": "UNCERTAIN",
            "voice_valence": "uncertain",
            "arousal": "low",
            "voice_confidence": 0.35,
            "vocal_tension": 30.0,
            "acoustic_stress_score": 30.0
        }
        state = self.get_fused_state("I feel really good today!", uncertain_voice)
        self.assertEqual(state["valence"], "positive")
        self.assertEqual(state["distress_level"], "none")
        self.assertEqual(state["response_mode"], "positive")

    # =========================================================================
    # MULTILINGUAL CAPABILITY TESTS
    # =========================================================================

    def test_multilingual_greetings(self):
        """Verify greetings in Indic languages remain casual with no distress"""
        greetings = [
            ("नमस्ते", "hi"),
            ("নমস্কার", "bn"),
            ("வணக்கம்", "ta"),
            ("నమస్కారం", "te")
        ]
        for text, lang in greetings:
            with self.subTest(lang=lang, text=text):
                state, resp = self.get_response(text, lang=lang)
                self.assertEqual(state["intent"], "greeting")
                self.assertEqual(state["distress_level"], "none")
                self.assertEqual(state["response_mode"], "casual")
                self.assertNotIn("14566", resp)


if __name__ == "__main__":
    unittest.main()

