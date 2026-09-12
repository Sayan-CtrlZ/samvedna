import io
import os
import time
import logging
from typing import Dict, Any, Optional
from app.config import settings

logger = logging.getLogger("samvedna.stt_bridge")

try:
    from sarvamai import SarvamAI
    SARVAM_SDK_AVAILABLE = True
except ImportError:
    SARVAM_SDK_AVAILABLE = False

try:
    import requests
    REQUESTS_AVAILABLE = True
except ImportError:
    REQUESTS_AVAILABLE = False


class SarvamSTTBridge:
    """
    Production-Grade Sarvam AI Saaras v3 Speech-to-Text Bridge.
    Adheres strictly to Section 6.2 of SAMVEDNA PRD v2:
      - Model: saaras:v3
      - Mode: verbatim (preserves hesitations, vocal fillers, repetitions indicative of trauma)
      - Language Code: unknown (automatic Indic code-switching detection across 22 languages + Hinglish)
      - Zero-Disk Invariant: Processes strictly in-memory via io.BytesIO (zero temporary files or disk writes).
      - Graceful Fallback: On failure or missing key, returns low-confidence empty transcript so DDS engine
        redistributes NLP weight without failing or halting check-in processing.
    """

    def __init__(self):
        self.api_key = getattr(settings, "SARVAM_API_KEY", None) or os.getenv("SARVAM_API_KEY", "")
        self.model = getattr(settings, "SARVAM_MODEL", "saaras:v3") or "saaras:v3"
        self.mode = getattr(settings, "SARVAM_MODE", "verbatim") or "verbatim"
        self.client = None
        self._init_client()

    def _init_client(self):
        if SARVAM_SDK_AVAILABLE and self.api_key:
            try:
                self.client = SarvamAI(api_subscription_key=self.api_key)
                logger.info(f"[SARVAM-STT] Client initialized with model {self.model} (mode: {self.mode})")
            except Exception as e:
                logger.warning(f"[SARVAM-STT] Could not initialize SarvamAI client: {e}")
                self.client = None

    def refresh_key_if_needed(self):
        """Refreshes API key dynamically if set at runtime."""
        current_key = getattr(settings, "SARVAM_API_KEY", None) or os.getenv("SARVAM_API_KEY", "")
        if current_key and (current_key != self.api_key or self.client is None):
            self.api_key = current_key
            self._init_client()

    def transcribe(
        self,
        audio_bytes: bytes,
        filename: str = "audio.wav",
        language_code: str = "unknown"
    ) -> Dict[str, Any]:
        """
        Transcribes in-memory audio bytes using Sarvam Saaras v3 in verbatim mode.
        Guarantees zero disk writes — uses io.BytesIO directly.
        Returns:
          {
            "transcript": str,
            "confidence": "high" | "low",
            "language_code": str,
            "provider": "sarvam_saaras_v3" | "fallback",
            "elapsed_sec": float,
            "success": bool
          }
        """
        self.refresh_key_if_needed()

        if not audio_bytes or len(audio_bytes) < 100:
            logger.warning("[SARVAM-STT] Audio buffer empty or too small.")
            return self._build_fallback("Audio buffer too short or empty")

        if not self.api_key:
            logger.info("[SARVAM-STT] SARVAM_API_KEY unconfigured; deploying graceful fallback (nlp_score=0, confidence=low).")
            return self._build_fallback("SARVAM_API_KEY not configured")

        t_start = time.time()

        # 1. Try SarvamAI Python SDK
        if SARVAM_SDK_AVAILABLE and self.client:
            try:
                # In-memory buffer tuple: (filename, BytesIO, mime_type)
                audio_buffer = io.BytesIO(audio_bytes)
                file_payload = (filename or "audio.wav", audio_buffer, "audio/wav")

                response = self.client.speech_to_text.transcribe(
                    file=file_payload,
                    model=self.model,
                    mode=self.mode,
                    language_code=language_code or "unknown"
                )

                transcript = ""
                if hasattr(response, "transcript") and response.transcript:
                    transcript = response.transcript.strip()
                elif isinstance(response, dict):
                    transcript = response.get("transcript", "").strip()

                if transcript:
                    elapsed = time.time() - t_start
                    detected_lang = getattr(response, "language_code", language_code) or language_code
                    logger.info(f"[SARVAM-STT] Verbatim transcript generated in {elapsed:.2f}s: '{transcript[:70]}...'")
                    return {
                        "transcript": transcript,
                        "confidence": "high",
                        "language_code": detected_lang,
                        "provider": f"sarvam_{self.model}",
                        "elapsed_sec": round(elapsed, 3),
                        "success": True
                    }
            except Exception as e:
                logger.warning(f"[SARVAM-STT] SDK transcription failed: {e}. Trying direct REST endpoint...")

        # 2. Direct HTTP REST API Fallback (still zero-disk via in-memory buffer)
        if REQUESTS_AVAILABLE:
            try:
                audio_buffer = io.BytesIO(audio_bytes)
                files = {
                    "file": (filename or "audio.wav", audio_buffer, "audio/wav")
                }
                data = {
                    "model": self.model,
                    "mode": self.mode,
                    "language_code": language_code or "unknown"
                }
                headers = {
                    "api-subscription-key": self.api_key
                }
                resp = requests.post(
                    "https://api.sarvam.ai/speech-to-text",
                    headers=headers,
                    files=files,
                    data=data,
                    timeout=12.0
                )
                if resp.status_code == 200:
                    resp_data = resp.json()
                    transcript = resp_data.get("transcript", "").strip()
                    elapsed = time.time() - t_start
                    if transcript:
                        logger.info(f"[SARVAM-STT-REST] Verbatim transcript generated in {elapsed:.2f}s: '{transcript[:70]}...'")
                        return {
                            "transcript": transcript,
                            "confidence": "high",
                            "language_code": resp_data.get("language_code", language_code),
                            "provider": "sarvam_rest",
                            "elapsed_sec": round(elapsed, 3),
                            "success": True
                        }
                else:
                    logger.warning(f"[SARVAM-STT-REST] HTTP {resp.status_code}: {resp.text}")
            except Exception as e:
                logger.warning(f"[SARVAM-STT-REST] Direct REST request failed: {e}")

        return self._build_fallback("Sarvam STT service unavailable")

    def _build_fallback(self, reason: str) -> Dict[str, Any]:
        """Provides a safe, non-crashing fallback response per PRD Section 6.2."""
        return {
            "transcript": "",
            "confidence": "low",
            "language_code": "unknown",
            "provider": "fallback",
            "elapsed_sec": 0.0,
            "success": False,
            "reason": reason
        }


stt_bridge = SarvamSTTBridge()
