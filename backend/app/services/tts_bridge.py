import os
import time
import logging
from typing import Dict, Any, Optional
from app.config import settings

logger = logging.getLogger("samvedna.tts_bridge")

try:
    import requests
    REQUESTS_AVAILABLE = True
except ImportError:
    REQUESTS_AVAILABLE = False


class SarvamTTSBridge:
    """
    Production-Grade Sarvam AI Bulbul v1 Text-to-Speech (TTS) Bridge.
    Converts Indic & English trauma-informed AI responses into natural, compassionate speech audio.
    Supports 11+ Indian languages (hi-IN, en-IN, mr-IN, ta-IN, te-IN, kn-IN, ml-IN, gu-IN, etc.).
    """

    LANGUAGE_MAP = {
        "hi": "hi-IN",
        "en": "en-IN",
        "mr": "mr-IN",
        "ta": "ta-IN",
        "te": "te-IN",
        "kn": "kn-IN",
        "ml": "ml-IN",
        "gu": "gu-IN",
        "bn": "bn-IN",
        "pa": "pa-IN",
        "or": "or-IN",
    }

    DEFAULT_SPEAKERS = {
        "hi-IN": "roopa",
        "en-IN": "roopa",
        "bn-IN": "roopa",
        "mr-IN": "roopa",
        "ta-IN": "roopa",
        "te-IN": "roopa",
        "gu-IN": "roopa",
        "pa-IN": "roopa",
        "kn-IN": "roopa",
        "ml-IN": "roopa",
    }

    def __init__(self):
        self.api_key = getattr(settings, "SARVAM_API_KEY", None) or os.getenv("SARVAM_API_KEY", "")
        self.model = "bulbul:v3"

    def refresh_key_if_needed(self):
        current_key = getattr(settings, "SARVAM_API_KEY", None) or os.getenv("SARVAM_API_KEY", "")
        if current_key:
            self.api_key = current_key

    def synthesize(
        self,
        text: str,
        language: str = "auto",
        speaker: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Converts text string to speech audio base64 via Sarvam AI Bulbul v3.
        Auto-detects script language from text if language=='auto' or missing.
        """
        self.refresh_key_if_needed()

        if not text or not text.strip():
            return {"success": False, "reason": "Text string is empty", "provider": "fallback"}

        if not self.api_key:
            logger.info("[SARVAM-TTS] SARVAM_API_KEY not configured. Falling back to browser TTS.")
            return {"success": False, "reason": "SARVAM_API_KEY not configured", "provider": "fallback"}

        # Language Auto-Detection from Text Script
        if not language or language == "auto" or language not in self.LANGUAGE_MAP:
            from app.services.nlp_engine import nlp_engine
            detected = nlp_engine.detect_language(text)
            target_lang = self.LANGUAGE_MAP.get(detected, "hi-IN")
        else:
            # Double check if text contains native script of a different language (e.g. Tamil text passed with language='hi')
            from app.services.nlp_engine import nlp_engine
            detected = nlp_engine.detect_language(text)
            target_lang = self.LANGUAGE_MAP.get(detected, self.LANGUAGE_MAP.get(language.lower(), "hi-IN"))

        # Select native speaker matching target language (roopa supports all Indic languages in bulbul:v3)
        target_speaker = speaker if (speaker and speaker not in ["meera", "anushka", "default"]) else self.DEFAULT_SPEAKERS.get(target_lang, "roopa")

        t_start = time.time()

        # Sanitize text length (Sarvam TTS operates best on <= 500 chars per chunk)
        clean_text = text.strip()[:500]

        payload = {
            "inputs": [clean_text],
            "target_language_code": target_lang,
            "speaker": target_speaker,
            "pitch": 0,
            "pace": 1.0,
            "loudness": 1.5,
            "speech_sample_rate": 22050,
            "enable_preprocessing": True,
            "model": self.model
        }

        headers = {
            "api-subscription-key": self.api_key,
            "Content-Type": "application/json"
        }

        if REQUESTS_AVAILABLE:
            try:
                resp = requests.post(
                    "https://api.sarvam.ai/text-to-speech",
                    json=payload,
                    headers=headers,
                    timeout=10
                )
                elapsed = time.time() - t_start

                if resp.status_code == 200:
                    data = resp.json()
                    audios = data.get("audios", [])
                    if audios and len(audios) > 0 and len(audios[0]) > 0:
                        logger.info(f"[SARVAM-TTS] Successfully synthesized {len(clean_text)} chars into speech audio in {elapsed:.2f}s (lang: {target_lang}).")
                        return {
                            "success": True,
                            "audio_base64": audios[0],
                            "provider": "sarvam_bulbul_v1",
                            "language_code": target_lang,
                            "elapsed_sec": round(elapsed, 3)
                        }

                logger.warning(f"[SARVAM-TTS] HTTP {resp.status_code}: {resp.text}")
            except Exception as e:
                logger.warning(f"[SARVAM-TTS] Synthesis request failed: {e}")

        return {"success": False, "reason": "Sarvam TTS API unavailable", "provider": "fallback"}


tts_bridge = SarvamTTSBridge()
