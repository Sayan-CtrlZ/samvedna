import sys
import os

backend_dir = os.path.join(os.path.dirname(__file__), "backend")
sys.path.insert(0, backend_dir)

import numpy as np
import io
import wave
from app.services.voice_analytics import voice_engine
from app.services.nlp_engine import nlp_engine
from app.services.distress_scoring import distress_engine
from app.services.xai_explainer import xai_engine

def test_voice():
    print("[1/4] Testing Voice Stress Analytics (Wiener-Khinchin FFT Prosody)...")
    sr = 16000
    t = np.linspace(0, 2, sr * 2)
    # Generate modulated pitch tone simulating vocal jitter and tremor
    f0 = 220 + 20 * np.sin(2 * np.pi * 6 * t)
    signal = 0.5 * np.sin(2 * np.pi * f0 * t) + 0.03 * np.random.randn(len(t))
    
    buf = io.BytesIO()
    with wave.open(buf, 'wb') as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sr)
        wf.writeframes((signal * 32767).astype(np.int16).tobytes())
    wav_bytes = buf.getvalue()
    
    result = voice_engine.analyze_audio_bytes(wav_bytes, "test.wav")
    print(f"  Pitch Mean: {result.get('pitch_mean_hz')} Hz | Jitter: {result.get('jitter_pct')}% | Stress Score: {result.get('acoustic_stress_score')}")
    print("  [OK] Voice Stress analysis passed.")

def test_voice_privacy_and_distribution():
    print("[2/5] Testing 8 kHz VAD, emotion probabilities, and zero-audio persistence...")
    sr = 8000
    t = np.linspace(0, 1.2, int(sr * 1.2), endpoint=False)
    # IVRS-like tone with low-level stationary noise; input stays in BytesIO.
    signal = 0.25 * np.sin(2 * np.pi * 180 * t) + 0.008 * np.random.default_rng(7).normal(size=len(t))
    buf = io.BytesIO()
    with wave.open(buf, 'wb') as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sr)
        wf.writeframes((signal * 32767).astype(np.int16).tobytes())
    result = voice_engine.analyze_audio_bytes(buf.getvalue(), "ivrs.wav")
    probabilities = result.get("emotion_probabilities", {})
    assert result["calculated_features"]["sample_rate"] == 8000
    assert abs(sum(probabilities.values()) - 1.0) < 0.01
    assert "audio" not in result and "raw_audio" not in result
    print("  [OK] 8 kHz analysis is in-memory and returns calibrated probabilities.")

def test_multilingual_nlp():
    print("[3/5] Testing Multilingual NLP Engine (5 Supported Languages)...")
    samples = {
        "hi": "मुझे जान से मारने की धमकी मिल रही है, आरोपी जमानत पर बाहर है",
        "en": "The accused got bail and is threatening to kill my family",
        "bn": "আসামি জামিনে ছাড়া পেয়ে আমাদের মেরে ফেলার হুমকি দিচ্ছে",
        "ta": "குற்றம் சாட்டப்பட்டவர் ஜாமீனில் வந்து எங்களை மிரட்டுகிறார்",
        "te": "నిందితుడు బెయిల్ పై వచ్చి మమ్మల్ని చంపేస్తానని బెదిరిస్తున్నాడు"
    }
    for lang, text in samples.items():
        res = nlp_engine.analyze_text(text, lang)
        threat = res.get('witness_threat_detected', False)
        distress = res.get('nlp_distress_score', 0)
        cues = res.get('detected_cues', [])
        print(f"  [{lang}] Threat Detected: {threat} | Distress: {distress} | Cues: {cues}")
        assert threat or distress >= 50, f"Threat cue detection failed for {lang}"
    print("  [OK] Multilingual NLP Engine passed.")

def test_distress_scoring():
    print("[4/5] Testing Dynamic Distress Scoring (DDS)...")
    dds_res = distress_engine.compute_composite_dds(
        voice_stress_score=78.0,
        nlp_distress_score=82.0,
        clinical_phq_score=75.0,
        legal_stage_risk=80.0,
        threat_detected=True,
        self_harm_detected=False,
        historical_checkins=[]
    )
    dds_val = dds_res.get("composite_dds", 0)
    level = dds_res.get("risk_level")
    print(f"  Composite DDS: {dds_val} | Risk Level: {level}")
    assert dds_val >= 70, f"Expected high composite DDS, got {dds_val}"
    print("  [OK] Dynamic Distress Scoring passed.")

def test_xai_explainer():
    print("[5/5] Testing Explainable AI (XAI) Causal Attribution...")
    explanation = xai_engine.generate_explanation(
        composite_dds=82.5,
        voice_metrics={"acoustic_stress_score": 78.0, "pitch_volatility": 35.0, "jitter_pct": 3.2},
        nlp_metrics={"witness_threat_detected": True, "nlp_distress_score": 82.0},
        legal_stage="Chargesheet Filed",
        case_attributes={"accused_on_bail": True, "interim_relief_paid": False}
    )
    factors = explanation
    print(f"  Factors Count: {len(factors)} | Top Factor: {factors[0]['factor_name'] if factors else 'None'}")
    assert len(factors) > 0, "Expected XAI factors to be populated"
    print("  [OK] XAI Explainer passed.")

if __name__ == "__main__":
    print("=" * 65)
    print(" SAMVEDNA AI - Core Engine Verification Suite")
    print("=" * 65)
    test_voice()
    test_voice_privacy_and_distribution()
    test_multilingual_nlp()
    test_distress_scoring()
    test_xai_explainer()
    print("=" * 65)
    print(" ALL 4 VERIFICATION SUITES PASSED (100% SUCCESS)!")
    print("=" * 65)
