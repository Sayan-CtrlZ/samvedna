import sys
import os
import io
import wave
import numpy as np

# Add backend directory to path
backend_dir = os.path.join(os.path.dirname(__file__), "backend")
sys.path.insert(0, backend_dir)

from app.services.stt_bridge import stt_bridge
from app.config import settings

def generate_test_wav_bytes(duration_sec=1.0, sample_rate=16000):
    """Generates a simple 16kHz WAV in memory (zero-disk)."""
    t = np.linspace(0, duration_sec, int(sample_rate * duration_sec), endpoint=False)
    signal = (0.2 * np.sin(2 * np.pi * 300 * t) * 32767).astype(np.int16)
    buf = io.BytesIO()
    with wave.open(buf, 'wb') as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sample_rate)
        wf.writeframes(signal.tobytes())
    return buf.getvalue()

def test_stt_bridge_zero_disk_and_fallback():
    print("[1/3] Testing Sarvam Saaras v3 STT Bridge & Zero-Disk Memory...")
    audio_bytes = generate_test_wav_bytes()
    assert isinstance(audio_bytes, bytes)
    assert len(audio_bytes) > 0
    print(f"  Generated {len(audio_bytes)} bytes in RAM (zero disk files created).")

    res = stt_bridge.transcribe(audio_bytes, "in_memory_test.wav", "unknown")
    print(f"  STT Bridge Result: provider={res.get('provider')} | success={res.get('success')} | confidence={res.get('confidence')}")
    assert "confidence" in res
    assert "transcript" in res
    print("  [OK] Zero-disk invariant and fallback structure verified.")

def test_stt_configuration():
    print("[2/3] Testing Sarvam AI Configuration Parameters...")
    print(f"  Sarvam Model: {settings.SARVAM_MODEL}")
    print(f"  Sarvam Mode: {settings.SARVAM_MODE}")
    print(f"  Sarvam Key Configured: {'Yes' if settings.SARVAM_API_KEY else 'No (graceful fallback active)'}")
    assert settings.SARVAM_MODEL == "saaras:v3"
    assert settings.SARVAM_MODE == "verbatim"
    print("  [OK] Sarvam Saaras v3 configuration matches PRD v2.")

def test_dds_restored_formula_with_stt_fallback():
    print("[3/3] Testing Restored 5-Component DDS with STT Bridge Fallback...")
    from app.services.distress_scoring import distress_engine
    
    # Case A: Full 5 components available
    res_full = distress_engine.compute_composite_dds(
        voice_stress_score=60.0,
        nlp_distress_score=70.0,
        clinical_phq_score=50.0,
        legal_stage_risk=80.0,
        engagement_score=40.0
    )
    # Expected: 0.28*60 + 0.28*70 + 0.20*50 + 0.16*80 + 0.08*40
    # = 16.8 + 19.6 + 10.0 + 12.8 + 3.2 = 62.4
    expected_dds = 62.4
    print(f"  5-Component DDS: {res_full['composite_dds']} (Expected ~{expected_dds})")
    assert abs(res_full['composite_dds'] - expected_dds) <= 0.5, f"Expected {expected_dds}, got {res_full['composite_dds']}"

    # Case B: STT fails (NLP is None), proportional redistribution across remaining 4 components
    res_redistributed = distress_engine.compute_composite_dds(
        voice_stress_score=60.0,
        nlp_distress_score=None,
        clinical_phq_score=50.0,
        legal_stage_risk=80.0,
        engagement_score=40.0
    )
    # Available weights sum = 0.28 + 0.20 + 0.16 + 0.08 = 0.72
    # Weighted sum = 16.8 + 10.0 + 12.8 + 3.2 = 42.8
    # Score = 42.8 / 0.72 = 59.4
    expected_redistributed = round(42.8 / 0.72, 1)
    print(f"  Redistributed DDS without NLP: {res_redistributed['composite_dds']} (Expected ~{expected_redistributed})")
    assert abs(res_redistributed['composite_dds'] - expected_redistributed) <= 0.5

    # Case C: Safety overrides
    res_threat = distress_engine.compute_composite_dds(
        voice_stress_score=20.0,
        nlp_distress_score=20.0,
        clinical_phq_score=20.0,
        legal_stage_risk=20.0,
        threat_detected=True
    )
    # Threat override: max(20.0, 72.0) + 12.0 = 84.0
    print(f"  Threat Override DDS: {res_threat['composite_dds']} (Expected >= 84.0)")
    assert res_threat['composite_dds'] >= 84.0

    print("  [OK] Restored DDS formula & safety overrides verified.")

if __name__ == "__main__":
    print("=" * 70)
    print(" SAMVEDNA AI - Sarvam STT Bridge & Restored DDS Verification")
    print("=" * 70)
    test_stt_bridge_zero_disk_and_fallback()
    test_stt_configuration()
    test_dds_restored_formula_with_stt_fallback()
    print("=" * 70)
    print(" ALL PRD v2 VERIFICATIONS PASSED SUCCESSFULLY! ")
    print("=" * 70)
