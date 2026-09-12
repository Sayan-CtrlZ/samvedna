from typing import Dict, Any, List, Optional
from datetime import datetime

class DynamicDistressScoringEngine:
    """
    Dynamic Distress Scoring (DDS) Engine.
    Restored 5-Component Multi-Modal Fusion per SAMVEDNA PRD v2:
      DDS = 0.28*Voice + 0.28*NLP + 0.20*Clinical + 0.16*Legal + 0.08*Engagement
    Safety Overrides:
      - Threat detected: max(DDS, 72.0) + 12.0
      - Self-harm detected: max(DDS, 85.0) + 10.0
    Proportional redistribution applied when components (e.g. STT fallback) are absent.
    """
    def __init__(self):
        self.w_voice = 0.28
        self.w_nlp = 0.28
        self.w_trauma_clinical = 0.20
        self.w_legal_threat = 0.16
        self.w_engagement = 0.08

    def compute_composite_dds(
        self,
        voice_stress_score: Optional[float] = None,
        nlp_distress_score: Optional[float] = None,
        clinical_phq_score: Optional[float] = None,
        legal_stage_risk: Optional[float] = None,
        engagement_score: Optional[float] = None,
        threat_detected: bool = False,
        self_harm_detected: bool = False,
        historical_checkins: Optional[List[Dict[str, Any]]] = None,
        voice_emotion_probabilities: Optional[Dict[str, float]] = None,
        nlp_categories: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        available_components = []
        weighted_sum = 0.0
        available_weight_sum = 0.0

        if voice_stress_score is not None:
            available_components.append("voice")
            weighted_sum += self.w_voice * voice_stress_score
            available_weight_sum += self.w_voice

        if nlp_distress_score is not None:
            available_components.append("nlp")
            weighted_sum += self.w_nlp * nlp_distress_score
            available_weight_sum += self.w_nlp

        if clinical_phq_score is not None:
            available_components.append("clinical")
            weighted_sum += self.w_trauma_clinical * clinical_phq_score
            available_weight_sum += self.w_trauma_clinical

        if legal_stage_risk is not None:
            available_components.append("legal")
            weighted_sum += self.w_legal_threat * legal_stage_risk
            available_weight_sum += self.w_legal_threat

        if engagement_score is not None:
            available_components.append("engagement")
            weighted_sum += self.w_engagement * engagement_score
            available_weight_sum += self.w_engagement

        if available_weight_sum == 0.0:
            return {"status": "insufficient_data", "message": "No valid components provided for DDS calculation."}

        base_score = weighted_sum / available_weight_sum
        initial_base_score = round(base_score, 1)

        if threat_detected:
            base_score = max(base_score, 72.0) + 12.0
        if self_harm_detected:
            base_score = max(base_score, 85.0) + 10.0

        # Safety-first discordance handling: an intense acoustic panic pattern
        # must not be averaged away by calm/brief text.  Conversely, linguistic
        # self-harm/threat evidence remains an override even with flat affect.
        voice_emotion_probabilities = voice_emotion_probabilities or {}
        acoustic_panic = float(voice_emotion_probabilities.get("acute_panic", 0.0))
        acoustic_fear = float(voice_emotion_probabilities.get("fear", 0.0))
        
        if voice_stress_score is not None:
            if voice_stress_score >= 75.0 or acoustic_panic >= 0.55:
                base_score = max(base_score, 74.0 + 16.0 * acoustic_panic)
            elif nlp_distress_score is not None and voice_stress_score >= 62.0 and nlp_distress_score < 35.0:
                base_score = max(base_score, 60.0 + 10.0 * acoustic_fear)
                
        composite_dds = round(min(100.0, max(0.0, base_score)), 1)
        safety_adjustment = round(composite_dds - initial_base_score, 1)
        
        if composite_dds >= 80.0:
            risk_level = "CRITICAL"
            risk_color = "#EF4444"
        elif composite_dds >= 60.0:
            risk_level = "HIGH"
            risk_color = "#F97316"
        elif composite_dds >= 35.0:
            risk_level = "MODERATE"
            risk_color = "#EAB308"
        else:
            risk_level = "LOW"
            risk_color = "#10B981"
            
        previous_dds = None
        escalation_delta = 0.0
        is_escalating_rapidly = False
        trajectory_label = "Stable / Baseline"
        
        if historical_checkins and len(historical_checkins) > 0:
            prev_record = historical_checkins[-1]
            previous_dds = prev_record.get("composite_dds", prev_record.get("dds", 40.0))
            escalation_delta = round(composite_dds - previous_dds, 1)
            
            if escalation_delta >= 18.0:
                is_escalating_rapidly = True
                trajectory_label = "Acute Crisis Spike (Immediate Intervention Needed)"
            elif escalation_delta >= 10.0:
                is_escalating_rapidly = True
                trajectory_label = "Rapid Escalation (High Risk Trend)"
            elif escalation_delta <= -10.0:
                trajectory_label = "Significant Recovery / Stabilization"
            elif escalation_delta < 0:
                trajectory_label = "Gradual De-escalation"
            else:
                trajectory_label = "Chronic Elevated Distress" if composite_dds > 50 else "Stable Monitoring"

            # A short trailing mean limits one noisy check-in dominating the
            # 48–72 hour pre-alarm trajectory, while preserving abrupt spikes.
            trailing = [float(item.get("composite_dds", item.get("dds", composite_dds))) for item in historical_checkins[-3:]]
            if trailing:
                trajectory_mean = sum(trailing) / len(trailing)
                if composite_dds >= trajectory_mean + 12.0 and not is_escalating_rapidly:
                    is_escalating_rapidly = True
                    trajectory_label = "Sustained Upward Distress Trend (Human Review Needed)"
                
        immediate_alert = (
            risk_level in ["CRITICAL", "HIGH"] or
            is_escalating_rapidly or
            threat_detected or
            self_harm_detected
        )
        
        return {
            "voice_score": voice_stress_score if voice_stress_score is not None else None,
            "nlp_score": nlp_distress_score if nlp_distress_score is not None else None,
            "available_components": available_components,
            "base_dds": initial_base_score,
            "safety_adjustment": safety_adjustment,
            "composite_dds": composite_dds,
            "risk_level": risk_level,
            "risk_color": risk_color,
            "previous_dds": previous_dds,
            "escalation_delta": escalation_delta,
            "is_escalating_rapidly": is_escalating_rapidly,
            "risk_trajectory_label": trajectory_label,
            "immediate_alert_triggered": immediate_alert,
            "sub_scores": {
                "voice_stress": round(voice_stress_score, 1) if voice_stress_score is not None else None,
                "nlp_distress": round(nlp_distress_score, 1) if nlp_distress_score is not None else None,
                "clinical_trauma": round(clinical_phq_score, 1) if clinical_phq_score is not None else None,
                "legal_vulnerability": round(legal_stage_risk, 1) if legal_stage_risk is not None else None
            },
            "fusion_notes": {
                "voice_text_discordance_guard": bool(voice_stress_score is not None and nlp_distress_score is not None and voice_stress_score >= 62.0 and nlp_distress_score < 35.0),
                "safety_categories": nlp_categories or []
            }
        }

distress_engine = DynamicDistressScoringEngine()
