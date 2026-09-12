import sys
import os

# Add backend directory to sys.path
backend_dir = os.path.join(os.path.dirname(__file__), "backend")
sys.path.insert(0, backend_dir)

from app.config import settings
from app.services.llm_service import llm_engine

def test_configuration():
    print("[1/4] Testing Groq Configuration...")
    print(f"  Groq Model: {settings.GROQ_MODEL}")
    print(f"  Groq API Key Set: {'Yes' if settings.GROQ_API_KEY else 'No (offline/fallback mode)'}")
    assert hasattr(settings, "GROQ_API_KEY")
    assert hasattr(settings, "GROQ_MODEL")
    print("  [OK] Configuration loaded successfully.")

def test_engine_initialization():
    print("[2/4] Testing Groq LLM Engine Initialization...")
    assert llm_engine is not None
    print(f"  Groq Client Active: {'Yes' if llm_engine.groq_client else 'No (awaiting GROQ_API_KEY in .env)'}")
    print("  [OK] Engine initialized successfully.")

def test_conversational_response_fallback_and_handling():
    print("[3/4] Testing Conversational Response (Hindi & English)...")
    
    # Test Hindi check-in
    response_hi = llm_engine.generate_contextual_response(
        session_id="test-session-hi",
        user_message="मुझे बहुत डर लग रहा है, आरोपी ने मुझे धमकी दी है।",
        emotional_state={"mood": "Fear", "distress_level": "high"},
        voice_analysis={"acoustic_stress_score": 75.0, "primary_vocal_emotion": "Fear / Terror"},
        legal_context={"legal_stage": "Special Court Trial"},
        language="hi"
    )
    print(f"  [Hindi Response]: {response_hi[:90]}...")
    assert len(response_hi) > 10, "Expected non-empty response for Hindi"

    # Test English check-in
    response_en = llm_engine.generate_contextual_response(
        session_id="test-session-en",
        user_message="The accused is out on bail and roaming outside our house.",
        emotional_state={"mood": "Fear", "distress_level": "high"},
        voice_analysis={"acoustic_stress_score": 72.0, "primary_vocal_emotion": "Acute Distress"},
        legal_context={"legal_stage": "Accused Bail Hearing"},
        language="en"
    )
    print(f"  [English Response]: {response_en[:90]}...")
    assert len(response_en) > 10, "Expected non-empty response for English"
    print("  [OK] Conversational generation succeeded.")

def test_implicit_distress_scoring():
    print("[4/4] Testing Implicit Distress Score Estimation...")
    score = llm_engine.analyze_implicit_distress("I don't know if we will survive the night if they return.")
    print(f"  Implicit Distress Score: {score}")
    assert isinstance(score, float)
    print("  [OK] Implicit distress scoring completed.")

if __name__ == "__main__":
    print("=" * 70)
    print(" SAMVEDNA AI - Groq & Hybrid LLM Integration Test Suite")
    print("=" * 70)
    test_configuration()
    test_engine_initialization()
    test_conversational_response_fallback_and_handling()
    test_implicit_distress_scoring()
    print("=" * 70)
    print(" ALL TESTS PASSED SUCCESSFULLY! ")
    print("=" * 70)
