from typing import List, Dict, Any

class ExplainableAIEngine:
    def generate_explanation(
        self,
        composite_dds: float,
        voice_metrics: Dict[str, Any],
        nlp_metrics: Dict[str, Any],
        legal_stage: str,
        case_attributes: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        factors = []
        acoustic_score = voice_metrics.get("acoustic_stress_score", 20.0)
        jitter = voice_metrics.get("jitter_pct", 1.0)
        tremor = voice_metrics.get("tremor_intensity", 20.0)
        pauses = voice_metrics.get("pause_ratio", 0.2)
        
        if acoustic_score >= 65.0:
            factors.append({
                "factor_name": "Acoustic Voice Tremor & Stress",
                "category": "ACOUSTIC",
                "contribution_points": round(acoustic_score * 0.28, 1),
                "percentage_weight": 28.0,
                "description": f"Severe vocal instability (Jitter: {jitter}%, Tremor: {tremor}/100)",
                "evidence": f"Pronounced voice breaks and {int(pauses*100)}% speech hesitation indicative of acute trauma suppression."
            })
        elif acoustic_score >= 40.0:
            factors.append({
                "factor_name": "Elevated Voice Tension",
                "category": "ACOUSTIC",
                "contribution_points": round(acoustic_score * 0.28, 1),
                "percentage_weight": 28.0,
                "description": f"Moderate vocal pitch volatility ({voice_metrics.get('pitch_volatility', 20)} Hz)",
                "evidence": "Elevated nervous tension detected during verbal check-in."
            })
            
        threats = nlp_metrics.get("extracted_threat_keywords", [])
        if nlp_metrics.get("witness_threat_detected", False):
            cues_str = ", ".join(threats[:3]) if threats else "Death threats / pressure to withdraw FIR"
            factors.append({
                "factor_name": "Direct Perpetrator Threat / Intimidation",
                "category": "THREAT_SAFETY",
                "contribution_points": 32.5,
                "percentage_weight": 32.5,
                "description": "Witness intimidation or retaliation signals identified in communication",
                "evidence": f"Extracted cues: {cues_str}"
            })
            
        if nlp_metrics.get("social_boycott_detected", False):
            factors.append({
                "factor_name": "Social Ostracism / Caste Boycott",
                "category": "SOCIAL_BOYCOTT",
                "contribution_points": 22.0,
                "percentage_weight": 22.0,
                "description": "Community ostracism or denial of basic resources",
                "evidence": "Victim reported restricted access to water, employment, or village common facilities."
            })
            
        hopeless_score = nlp_metrics.get("hopelessness_score", 10.0)
        if hopeless_score >= 60.0 or nlp_metrics.get("self_harm_ideation_detected", False):
            factors.append({
                "factor_name": "Acute Hopelessness & Crisis Risk",
                "category": "NLP_EMOTION",
                "contribution_points": 26.0,
                "percentage_weight": 26.0,
                "description": "High despair and perceived lack of institutional protection",
                "evidence": "Language reflects severe depressive exhaustion and potential crisis state."
            })
            
        if "Bail" in legal_stage or case_attributes.get("accused_on_bail", False):
            factors.append({
                "factor_name": "Accused Bail Vulnerability",
                "category": "LEGAL_TRAUMA",
                "contribution_points": 18.0,
                "percentage_weight": 18.0,
                "description": "Perpetrator released on bail in proximity to victim residence",
                "evidence": f"Current legal milestone: {legal_stage}. Heightened fear of immediate physical reprisal."
            })
        elif "Trial" in legal_stage or "Witness" in legal_stage:
            factors.append({
                "factor_name": "Impending Court Witness Examination",
                "category": "LEGAL_TRAUMA",
                "contribution_points": 15.0,
                "percentage_weight": 15.0,
                "description": "Trial date proximity causing intense re-traumatization anxiety",
                "evidence": "Special Court deposition scheduled. High stress surrounding court confrontation."
            })
            
        if case_attributes.get("compensation_delayed", False):
            factors.append({
                "factor_name": "Relief & Compensation Disbursement Delay",
                "category": "ECONOMIC_VULNERABILITY",
                "contribution_points": 12.0,
                "percentage_weight": 12.0,
                "description": "Pending financial relief under SC/ST PoA Central Sector Scheme",
                "evidence": "Victim facing severe legal cost burden and loss of livelihood post-atrocity."
            })
            
        if not factors:
            factors.append({
                "factor_name": "Baseline Case Monitoring",
                "category": "BASELINE",
                "contribution_points": 10.0,
                "percentage_weight": 10.0,
                "description": "Regular follow-up in progress without acute emergent spikes.",
                "evidence": "Prosodic and sentiment markers remain within manageable baseline range."
            })
            
        return factors

xai_engine = ExplainableAIEngine()
