import os
import sys
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "backend"))

from app.services.distress_scoring import distress_engine

class TestDynamicDistressScoring(unittest.TestCase):
    def test_case_1_voice_and_nlp(self):
        """
        TEST 1: Voice = 70, NLP = 60
        Expected: DDS = 65, Risk = HIGH
        """
        result = distress_engine.compute_composite_dds(voice_stress_score=70.0, nlp_distress_score=60.0)
        self.assertEqual(result["base_dds"], 65.0)
        self.assertEqual(result["composite_dds"], 65.0)
        self.assertEqual(result["risk_level"], "HIGH")
        self.assertIn("voice", result["available_components"])
        self.assertIn("nlp", result["available_components"])

    def test_case_2_low_voice_and_nlp(self):
        """
        TEST 2: Voice = 30, NLP = 20
        Expected: DDS = 25, Risk = LOW
        """
        result = distress_engine.compute_composite_dds(voice_stress_score=30.0, nlp_distress_score=20.0)
        self.assertEqual(result["base_dds"], 25.0)
        self.assertEqual(result["composite_dds"], 25.0)
        self.assertEqual(result["risk_level"], "LOW")

    def test_case_3_critical_voice_and_nlp(self):
        """
        TEST 3: Voice = 80, NLP = 90
        Expected: DDS = 85, Risk = CRITICAL
        Wait: Voice = 80 triggers discordance/panic rule?
        Actually voice_stress_score=80 > 75.0 triggers base_score = max(base_score, 74.0).
        If base_score is 85, max(85, 74) is 85.
        So DDS should be 85.
        """
        result = distress_engine.compute_composite_dds(voice_stress_score=80.0, nlp_distress_score=90.0)
        self.assertEqual(result["base_dds"], 85.0)
        self.assertEqual(result["composite_dds"], 85.0)
        self.assertEqual(result["risk_level"], "CRITICAL")

    def test_case_4_voice_only(self):
        """
        TEST 4: Voice only = 70
        Expected: DDS = 70, Risk = HIGH, available_components = ["voice"]
        """
        result = distress_engine.compute_composite_dds(voice_stress_score=70.0, nlp_distress_score=None)
        self.assertEqual(result["base_dds"], 70.0)
        self.assertEqual(result["composite_dds"], 70.0)
        self.assertEqual(result["risk_level"], "HIGH")
        self.assertEqual(result["available_components"], ["voice"])

    def test_case_5_nlp_only(self):
        """
        TEST 5: NLP only = 60
        Expected: DDS = 60, Risk = HIGH, available_components = ["nlp"]
        """
        result = distress_engine.compute_composite_dds(voice_stress_score=None, nlp_distress_score=60.0)
        self.assertEqual(result["base_dds"], 60.0)
        self.assertEqual(result["composite_dds"], 60.0)
        self.assertEqual(result["risk_level"], "HIGH")
        self.assertEqual(result["available_components"], ["nlp"])

    def test_case_6_insufficient_data(self):
        """
        TEST 6: No valid voice or NLP result
        Expected: No fabricated DDS. Return insufficient-data status.
        """
        result = distress_engine.compute_composite_dds(voice_stress_score=None, nlp_distress_score=None)
        self.assertEqual(result.get("status"), "insufficient_data")

if __name__ == '__main__':
    unittest.main()
