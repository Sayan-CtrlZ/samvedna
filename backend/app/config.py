import os
from typing import Optional, List, Dict
from pydantic import BaseModel

# Load environment variables from .env file
try:
    from dotenv import load_dotenv
    current_dir = os.path.dirname(os.path.abspath(__file__))
    possible_envs = [
        os.path.abspath(os.path.join(current_dir, "..", "..", ".env")),
        os.path.abspath(os.path.join(current_dir, "..", ".env")),
        os.path.abspath(os.path.join(os.getcwd(), ".env")),
        os.path.abspath(os.path.join(os.getcwd(), "..", ".env")),
    ]
    for env_path in possible_envs:
        if os.path.exists(env_path):
            load_dotenv(env_path, override=True)
            break
    else:
        load_dotenv(override=True)
except ImportError:
    pass

class SystemSettings(BaseModel):
    PROJECT_NAME: str = "SAMVEDNA AI - NHAA 14566 Distress Prediction System"
    VERSION: str = "2.5.0"
    API_V1_STR: str = "/api/v1"
    
    # Groq API Configuration (openai/gpt-oss-120b on Groq LPU silicon)
    GROQ_API_KEY: Optional[str] = os.getenv("GROQ_API_KEY", None)
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")

    # Sarvam AI Speech-to-Text (Saaras v3 Indic ASR in verbatim mode)
    SARVAM_API_KEY: Optional[str] = os.getenv("SARVAM_API_KEY", None)
    SARVAM_MODEL: str = os.getenv("SARVAM_MODEL", "saaras:v3")
    SARVAM_MODE: str = os.getenv("SARVAM_MODE", "verbatim")
    
    # Audio Processing Settings
    ENABLE_NOISE_GATE: bool = os.getenv("ENABLE_NOISE_GATE", "True") == "True"
    
    # Distress Thresholds
    DISTRESS_LOW_MAX: float = 35.0      # 0-35: Green (Mild/Stable)
    DISTRESS_MODERATE_MAX: float = 60.0 # 36-60: Yellow (Moderate/Watchlist)
    DISTRESS_HIGH_MAX: float = 80.0     # 61-80: Orange (High Risk/Escalation)
    DISTRESS_CRITICAL_MIN: float = 80.0 # 81-100: Red (Critical/Acute Crisis)
    
    # Velocity Spike Alert (Jump of >= 18 pts in <= 7 days)
    ESCALATION_SPIKE_DELTA: float = 18.0
    
    # Helplines
    NHAA_HELPLINE: str = "14566"
    TELE_MANAS_HELPLINE: str = "14416"
    LEGAL_AID_NALSA: str = "15100"
    POLICE_EMERGENCY: str = "112"
    WOMEN_HELPLINE: str = "1091"
    
    # Mandated 5 Languages
    SUPPORTED_LANGUAGES: List[Dict[str, str]] = [
        {"code": "hi", "name": "हिन्दी (Hindi)", "native": "हिन्दी", "speech_code": "hi-IN"},
        {"code": "en", "name": "English", "native": "English", "speech_code": "en-IN"},
        {"code": "bn", "name": "বাংলা (Bengali)", "native": "বাংলা", "speech_code": "bn-IN"},
        {"code": "ta", "name": "தமிழ் (Tamil)", "native": "தமிழ்", "speech_code": "ta-IN"},
        {"code": "te", "name": "తెలుగు (Telugu)", "native": "తెలుగు", "speech_code": "te-IN"},
    ]

settings = SystemSettings()
