from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

class RiskLevelEnum(str, Enum):
    LOW = "LOW"             # Green
    MODERATE = "MODERATE"   # Yellow
    HIGH = "HIGH"           # Orange
    CRITICAL = "CRITICAL"   # Red

class LegalStageEnum(str, Enum):
    INVESTIGATION = "Investigation in Progress"
    BAIL_HEARING = "Accused Bail Hearing"
    CHARGESHEET = "Chargesheet Filed"
    WITNESS_TRIAL = "Witness Examination / Special Court Trial"
    COMPENSATION_PENDING = "Interim Relief / Compensation Pending"
    REHABILITATION = "Post-Trial Rehabilitation"

class AtrocityCategoryEnum(str, Enum):
    SC_ST_POA_VIOLENCE = "SC/ST PoA Act - Physical Assault / Grievous Hurt"
    RAPE_GANG_RAPE = "Atrocity Involving Rape / Sexual Violence"
    CASTE_MURDER = "Caste-Based Murder / Mob Lynching"
    ARSON_PROPERTY_LOSS = "Arson / Destruction of Dwellings"
    WITNESS_INTIMIDATION = "Witness Intimidation & Death Threats"
    SOCIAL_BOYCOTT = "Social Ostracism / Economic Boycott"

class VoiceAcousticMetrics(BaseModel):
    pitch_mean_hz: float = Field(..., description="Average Fundamental Frequency F0")
    pitch_volatility: float = Field(..., description="Standard deviation of pitch variation")
    jitter_pct: float = Field(..., description="Cycle-to-cycle pitch perturbation percentage")
    shimmer_pct: float = Field(..., description="Cycle-to-cycle amplitude perturbation percentage")
    hnr_db: float = Field(..., description="Harmonics-to-Noise Ratio in dB")
    pause_ratio: float = Field(..., description="Ratio of silent pauses to total speech duration")
    speech_tempo_syllables_sec: float = Field(..., description="Speech tempo/rate")
    tremor_intensity: float = Field(..., description="Acoustic vocal tremor indicator (0-100)")
    acoustic_stress_score: float = Field(..., description="Normalized voice distress score (0-100)")
    acoustic_classification: str = Field(..., description="e.g. Acute Panic / Elevated Tremor / Flat Affect")

class NLPEmotionMetrics(BaseModel):
    sentiment_polarity: float = Field(..., description="-1.0 (very negative) to +1.0 (positive)")
    fear_score: float = Field(0.0, description="Fear/terror signal (0-100)")
    sadness_score: float = Field(0.0, description="Depression/sadness signal (0-100)")
    hopelessness_score: float = Field(0.0, description="Despair/helplessness (0-100)")
    anger_score: float = Field(0.0, description="Anger/agitation (0-100)")
    trauma_flashback_detected: bool = False
    witness_threat_detected: bool = False
    social_boycott_detected: bool = False
    self_harm_ideation_detected: bool = False
    detected_language: str = "hi"
    extracted_threat_keywords: List[str] = []
    nlp_distress_score: float = Field(..., description="Consolidated NLP distress score (0-100)")
    emotion: str = Field("uncertain", description="Most likely non-diagnostic emotion label")
    valence: str = Field("NEUTRAL", description="POSITIVE, NEUTRAL, or NEGATIVE")
    arousal: str = Field("low", description="low, medium, or high activation")
    emotion_confidence: float = Field(0.0, description="Confidence in the emotion/valence inference (0-1)")

class ExplainableFactor(BaseModel):
    factor_name: str
    contribution_points: float
    percentage_weight: float
    description: str
    evidence: str
    category: str # "ACOUSTIC", "NLP_EMOTION", "LEGAL_TRAUMA", "THREAT_SAFETY", "ENGAGEMENT"

class DynamicDistressOutput(BaseModel):
    composite_dds: float = Field(..., description="Overall Dynamic Distress Score (0-100)")
    risk_level: RiskLevelEnum
    previous_dds: Optional[float] = None
    escalation_delta: float = 0.0
    is_escalating_rapidly: bool = False
    risk_trajectory_label: str # "Stable", "Escalating", "Acute Crisis Spike", "Improving"
    voice_metrics: Optional[VoiceAcousticMetrics] = None
    nlp_metrics: NLPEmotionMetrics
    explainable_factors: List[ExplainableFactor]
    clinical_flags: List[str]
    immediate_alert_triggered: bool = False
    recommended_interventions: List[str]

class CheckinCreateRequest(BaseModel):
    victim_id: str
    channel: str = "Web_Portal" # Web_Portal, IVRS, Mobile_App, Chatbot_14566
    text_content: Optional[str] = None
    audio_base64: Optional[str] = None # Base64 encoded audio or features
    audio_metrics_override: Optional[Dict[str, Any]] = None
    language: str = "hi"
    phq_gad_responses: Optional[Dict[str, int]] = None # {"anxiety": 2, "depressed": 3, "sleep": 2}
    is_sos: bool = False

class SOSRequest(BaseModel):
    victim_id: str
    channel: str = "EMERGENCY_PANIC_BUTTON"
    location_lat: Optional[float] = None
    location_lng: Optional[float] = None
    quick_message: Optional[str] = "EMERGENCY: Immediate safety assistance requested by atrocity victim."

class CounsellorNoteRequest(BaseModel):
    victim_id: str
    counsellor_name: str
    clinical_observations: str
    interventions_authorized: List[str]
    next_follow_up_days: int = 3
    risk_assessment_override: Optional[str] = None

class InterventionActionRequest(BaseModel):
    victim_id: str
    alert_id: Optional[str] = None
    intervention_type: str # WITNESS_PROTECTION, URGENT_COUNSELLING, INTERIM_RELIEF, SAFE_SHELTER, LEGAL_AID_EXPEDITE
    target_authority: str # SP, DM, DLSA, DMHP
    instructions: str
