"""Regression tests for valence-aware emotion handling."""
import os
import sys
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "backend"))

from app.services.nlp_engine import nlp_engine
from app.services.voice_analytics import voice_engine
from app.services.mood_estimator import mood_estimator


class EmotionPipelineTests(unittest.TestCase):
    def test_text_valence_examples(self):
        cases = [
            ("I'm so happy today!", "POSITIVE"),
            ("I am really excited about the competition!", "POSITIVE"),
            ("Everything is normal today.", "NEUTRAL"),
            ("I am extremely worried and scared.", "NEGATIVE"),
            ("I feel overwhelmed and stressed.", "NEGATIVE"),
        ]
        for text, expected in cases:
            with self.subTest(text=text):
                result = nlp_engine.analyze_text(text, "en")
                self.assertEqual(result["valence"], expected)
                self.assertGreater(result["emotion_confidence"], 0.45)

    def test_high_pitch_and_energy_are_not_stress_by_themselves(self):
        result = voice_engine.classify_acoustic_features({
            "pitch_mean_hz": 285, "pitch_volatility": 33, "jitter_pct": 1.0,
            "shimmer_pct": 3.0, "hnr_db": 22, "pause_ratio": 0.06,
            "speech_tempo_syllables_sec": 5.5, "tremor_intensity": 12,
        })
        self.assertEqual(result["primary_vocal_emotion"], "Uncertain / High Arousal")
        self.assertEqual(result["valence"], "UNCERTAIN")
        self.assertLess(result["acoustic_stress_score"], 40)

    def test_positive_text_resolves_high_arousal_voice_without_distress(self):
        nlp = nlp_engine.analyze_text("I am so excited and happy today!", "en")
        voice = voice_engine.classify_acoustic_features({
            "pitch_mean_hz": 290, "pitch_volatility": 31, "jitter_pct": 1.1,
            "shimmer_pct": 3.1, "hnr_db": 21, "pause_ratio": 0.05,
            "speech_tempo_syllables_sec": 5.2, "tremor_intensity": 13,
        })
        voice["has_audio"] = True
        state = mood_estimator.estimate_mood("I am so excited and happy today!", nlp, voice, language="en")
        self.assertEqual(state["valence"], "POSITIVE")
        self.assertEqual(state["distress_level"], "low")


if __name__ == "__main__":
    unittest.main()
