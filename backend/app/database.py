import json
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional

class AtrocityMonitoringDatabase:
    def __init__(self):
        self.victims: Dict[str, Dict[str, Any]] = {}
        self.checkins: Dict[str, List[Dict[str, Any]]] = {}
        self.alerts: List[Dict[str, Any]] = []
        self.counsellor_notes: Dict[str, List[Dict[str, Any]]] = {}
        self.interventions_history: List[Dict[str, Any]] = []
        self._seed_initial_data()

    def _seed_initial_data(self):
        seed_cases = [
            {
                "victim_id": "VIC-MP-2024-881",
                "victim_code": "SURVIVOR-MP-881",
                "code_name": "SURVIVOR-MP-881",
                "full_name_masked": "SURVIVOR-MP-881",
                "state": "Madhya Pradesh",
                "district": "Morena",
                "location": "GPS: 26.4980° N, 77.9940° E (Morena, Madhya Pradesh)",
                "emergency_contact": "+91-98765-XXXX1",
                "current_risk_level": "CRITICAL",
                "current_dds": 88.5,
                "trend_status": "Acute Crisis Spike (+24 pts)",
                "summary": "Threats and intimidation experienced outside home. Accused associates approaching family."
            },
            {
                "victim_id": "VIC-UP-2024-409",
                "victim_code": "COMPLAINANT-UP-409",
                "code_name": "COMPLAINANT-UP-409",
                "full_name_masked": "COMPLAINANT-UP-409",
                "state": "Uttar Pradesh",
                "district": "Hathras",
                "location": "GPS: 27.5950° N, 78.0500° E (Hathras, Uttar Pradesh)",
                "emergency_contact": "+91-98765-XXXX2",
                "current_risk_level": "HIGH",
                "current_dds": 74.0,
                "trend_status": "Escalating Distress (+14 pts)",
                "summary": "High anxiety regarding threats received in village area."
            },
            {
                "victim_id": "VIC-RJ-2024-215",
                "victim_code": "SURVIVOR-RJ-215",
                "code_name": "SURVIVOR-RJ-215",
                "full_name_masked": "SURVIVOR-RJ-215",
                "state": "Rajasthan",
                "district": "Udaipur",
                "location": "GPS: 24.5854° N, 73.7125° E (Udaipur, Rajasthan)",
                "emergency_contact": "+91-98765-XXXX3",
                "current_risk_level": "HIGH",
                "current_dds": 68.5,
                "trend_status": "Social Boycott & Harassment (+16 pts)",
                "summary": "Dwelling damaged after dispute over village common well. Facing village social boycott."
            },
            {
                "victim_id": "VIC-MH-2024-114",
                "victim_code": "SURVIVOR-MH-114",
                "code_name": "SURVIVOR-MH-114",
                "full_name_masked": "SURVIVOR-MH-114",
                "state": "Maharashtra",
                "district": "Ahmednagar",
                "location": "GPS: 19.0948° N, 74.7480° E (Ahmednagar, Maharashtra)",
                "emergency_contact": "+91-98765-XXXX4",
                "current_risk_level": "CRITICAL",
                "current_dds": 84.0,
                "trend_status": "Witness Intimidation Spike (+26 pts)",
                "summary": "Approached by unknown individuals attempting to force signing retraction documents."
            },
            {
                "victim_id": "VIC-TN-2024-531",
                "victim_code": "SURVIVOR-TN-531",
                "code_name": "SURVIVOR-TN-531",
                "full_name_masked": "SURVIVOR-TN-531",
                "state": "Tamil Nadu",
                "district": "Tirunelveli",
                "location": "GPS: 8.7139° N, 77.7567° E (Tirunelveli, Tamil Nadu)",
                "emergency_contact": "+91-98765-XXXX5",
                "current_risk_level": "MODERATE",
                "current_dds": 54.0,
                "trend_status": "Monitoring (-8 pts)",
                "summary": "Physical recovery progressing. Apprehensive regarding safety in dominant community neighborhood."
            },
            {
                "victim_id": "VIC-BR-2024-712",
                "victim_code": "SURVIVOR-BR-712",
                "code_name": "SURVIVOR-BR-712",
                "full_name_masked": "SURVIVOR-BR-712",
                "state": "Bihar",
                "district": "Gaya",
                "location": "GPS: 24.7914° N, 85.0002° E (Gaya, Bihar)",
                "emergency_contact": "+91-98765-XXXX6",
                "current_risk_level": "HIGH",
                "current_dds": 76.5,
                "trend_status": "Severe Depressive Hopelessness",
                "summary": "Land encroachment dispute. Severe economic destitution and intimidation."
            }
        ]

        for case in seed_cases:
            vid = case["victim_id"]
            self.victims[vid] = case
            base_dds = case["current_dds"]
            history = []
            
            # W-3
            history.append({
                "checkin_id": f"CHK-{vid}-01",
                "victim_id": vid,
                "timestamp": (datetime.now() - timedelta(days=21)).isoformat(),
                "channel": "NHAA_14566_Call",
                "input_type": "Voice",
                "transcript": "Aaropi ki taraf se dhamki aur dar ka mahol Aaropi ki taraf se dhamki aur dar ka mahol Aaropi ki taraf se dhamki aur dar ka mahol Aaropi ki taraf se dhamki aur dar ka mahol Aaropi ki taraf se dhamki aur dar ka mahol ? Aaropi ki taraf se dhamki aur dar ka mahol Aaropi ki taraf se dhamki aur dar ka mahol, Aaropi ki taraf se dhamki aur dar ka mahol Aaropi ki taraf se dhamki aur dar ka mahol Aaropi ki taraf se dhamki aur dar ka mahol Aaropi ki taraf se dhamki aur dar ka mahol",
                "voice_metrics": {
                    "pitch_mean_hz": 195.0,
                    "pitch_volatility": 18.0,
                    "jitter_pct": 1.2,
                    "shimmer_pct": 4.1,
                    "hnr_db": 19.5,
                    "pause_ratio": 0.22,
                    "speech_tempo_syllables_sec": 3.8,
                    "tremor_intensity": 25.0,
                    "acoustic_stress_score": 38.0,
                    "acoustic_classification": "Moderate Tension / Controlled"
                },
                "nlp_metrics": {
                    "sentiment_polarity": -0.15,
                    "fear_score": 30.0,
                    "sadness_score": 35.0,
                    "hopelessness_score": 25.0,
                    "anger_score": 15.0,
                    "witness_threat_detected": False,
                    "social_boycott_detected": False,
                    "self_harm_ideation_detected": False,
                    "nlp_distress_score": 34.0,
                    "extracted_threat_keywords": []
                },
                "composite_dds": round(max(20.0, base_dds - 28.0), 1),
                "risk_level": "MODERATE",
                "explainable_summary": "Baseline follow-up."
            })
            
            # W-2
            history.append({
                "checkin_id": f"CHK-{vid}-02",
                "victim_id": vid,
                "timestamp": (datetime.now() - timedelta(days=14)).isoformat(),
                "channel": "Mobile_App",
                "input_type": "Hybrid",
                "transcript": "Aaropi ki taraf se dhamki aur dar ka mahol Aaropi ki taraf se dhamki aur dar ka mahol Aaropi ki taraf se dhamki aur dar ka mahol Aaropi ki taraf se dhamki aur dar ka mahol Aaropi ki taraf se dhamki aur dar ka mahol Aaropi ki taraf se dhamki aur dar ka mahol Aaropi ki taraf se dhamki aur dar ka mahol Aaropi ki taraf se dhamki aur dar ka mahol Aaropi ki taraf se dhamki aur dar ka mahol",
                "voice_metrics": {
                    "pitch_mean_hz": 215.0,
                    "pitch_volatility": 24.5,
                    "jitter_pct": 2.1,
                    "shimmer_pct": 6.8,
                    "hnr_db": 15.2,
                    "pause_ratio": 0.31,
                    "speech_tempo_syllables_sec": 3.1,
                    "tremor_intensity": 45.0,
                    "acoustic_stress_score": 52.0,
                    "acoustic_classification": "Elevated Nervous Strain"
                },
                "nlp_metrics": {
                    "sentiment_polarity": -0.45,
                    "fear_score": 55.0,
                    "sadness_score": 45.0,
                    "hopelessness_score": 40.0,
                    "anger_score": 20.0,
                    "witness_threat_detected": False,
                    "social_boycott_detected": False,
                    "self_harm_ideation_detected": False,
                    "nlp_distress_score": 49.0,
                    "extracted_threat_keywords": ["bail"]
                },
                "composite_dds": round(max(30.0, base_dds - 15.0), 1),
                "risk_level": "MODERATE",
                "explainable_summary": "Bail application apprehension."
            })
            
            # W-1
            history.append({
                "checkin_id": f"CHK-{vid}-03",
                "victim_id": vid,
                "timestamp": (datetime.now() - timedelta(days=5)).isoformat(),
                "channel": "Web_Portal",
                "input_type": "Voice",
                "transcript": "Aaropi ki taraf se dhamki aur dar ka mahol Aaropi ki taraf se dhamki aur dar ka mahol Aaropi ki taraf se dhamki aur dar ka mahol Aaropi ki taraf se dhamki aur dar ka mahol Aaropi ki taraf se dhamki aur dar ka mahol Aaropi ki taraf se dhamki aur dar ka mahol Aaropi ki taraf se dhamki aur dar ka mahol Aaropi ki taraf se dhamki aur dar ka mahol Aaropi ki taraf se dhamki aur dar ka mahol Aaropi ki taraf se dhamki aur dar ka mahol Aaropi ki taraf se dhamki aur dar ka mahol Aaropi ki taraf se dhamki aur dar ka mahol Aaropi ki taraf se dhamki aur dar ka mahol",
                "voice_metrics": {
                    "pitch_mean_hz": 248.0,
                    "pitch_volatility": 38.0,
                    "jitter_pct": 3.8,
                    "shimmer_pct": 11.2,
                    "hnr_db": 10.4,
                    "pause_ratio": 0.40,
                    "speech_tempo_syllables_sec": 2.5,
                    "tremor_intensity": 74.0,
                    "acoustic_stress_score": 75.0,
                    "acoustic_classification": "High Vocal Tremor & Threat Constriction"
                },
                "nlp_metrics": {
                    "sentiment_polarity": -0.80,
                    "fear_score": 85.0,
                    "sadness_score": 60.0,
                    "hopelessness_score": 70.0,
                    "anger_score": 30.0,
                    "witness_threat_detected": True,
                    "social_boycott_detected": False,
                    "self_harm_ideation_detected": False,
                    "nlp_distress_score": 78.0,
                    "extracted_threat_keywords": ["dhamki", "case wapas"]
                },
                "composite_dds": base_dds,
                "risk_level": case["current_risk_level"],
                "explainable_summary": "Direct threat and high voice stress recorded."
            })
            
            self.checkins[vid] = history
            
            if case["current_risk_level"] in ["CRITICAL", "HIGH"]:
                self.alerts.append({
                    "alert_id": f"ALT-INIT-{vid[-4:]}",
                    "victim_id": vid,
                    "victim_name": case["victim_code"],
                    "district": case["district"],
                    "state": case["state"],
                    "severity": case["current_risk_level"],
                    "trigger_reason": f"DDS Spiked to {base_dds}/100. Witness intimidation cues & vocal tremor detected.",
                    "dds_score": base_dds,
                    "escalation_delta": 24.0 if case["current_risk_level"] == "CRITICAL" else 14.0,
                    "timestamp": (datetime.now() - timedelta(hours=3)).isoformat(),
                    "status": "ACTIVE",
                    "assigned_officer": "DSP Special Cell (PoA) & DLVMC Nodal Team",
                    "interventions": [
                        {
                            "id": f"INT-{vid[-4:]}-1",
                            "title": "Armed Police Escort & Security Picket",
                            "act_section": "Sec 15A(6)(b) SC/ST (PoA) Act",
                            "target_authority": f"Superintendent of Police, {case['district']}",
                            "urgency": "IMMEDIATE (Within 2h)"
                        },
                        {
                            "id": f"INT-{vid[-4:]}-2",
                            "title": "Emergency Tele-MANAS Psychological Consultation",
                            "act_section": "Rule 5(1)(e) PoA Rules",
                            "target_authority": "District Mental Health Officer",
                            "urgency": "URGENT (Within 4h)"
                        }
                    ]
                })

    def get_or_create_victim(self, victim_id: str) -> Dict[str, Any]:
        if victim_id not in self.victims:
            suffix = victim_id.replace("VIC-", "").upper()
            clean_code = f"SURVIVOR-{suffix}"
            self.victims[victim_id] = {
                "victim_id": victim_id,
                "victim_code": clean_code,
                "code_name": clean_code,
                "full_name_masked": clean_code,
                "state": "Maharashtra",
                "district": "Ahmednagar",
                "location": "GPS: 19.0760° N, 72.8777° E (Ahmednagar, Maharashtra)",
                "emergency_contact": "Emergency Helplines 14566 / 112",
                "current_risk_level": "AWAITING INTAKE",
                "current_dds": 0.0,
                "trend_status": "Active Survivor Intake",
                "summary": "Live survivor check-in session initiated via SAMVEDNA web portal."
            }
        return self.victims[victim_id]

    def get_all_victims(self) -> List[Dict[str, Any]]:
        return list(self.victims.values())

    def get_victim_by_id(self, victim_id: str) -> Optional[Dict[str, Any]]:
        return self.get_or_create_victim(victim_id)

    def get_victim_checkins(self, victim_id: str) -> List[Dict[str, Any]]:
        return self.checkins.get(victim_id, [])

    def add_checkin(self, victim_id: str, checkin_data: Dict[str, Any]):
        self.get_or_create_victim(victim_id)
        if victim_id not in self.checkins:
            self.checkins[victim_id] = []
        self.checkins[victim_id].append(checkin_data)
        
        # Update current DDS score, risk level, and user-described issue summary
        self.victims[victim_id]["current_dds"] = checkin_data["composite_dds"]
        self.victims[victim_id]["current_risk_level"] = checkin_data["risk_level"]
        self.victims[victim_id]["trend_status"] = checkin_data.get("risk_trajectory_label", "Updated via Live Intake")
        if checkin_data.get("transcript"):
            self.victims[victim_id]["summary"] = checkin_data["transcript"]

    def add_counsellor_note(self, victim_id: str, note_data: Dict[str, Any]):
        if victim_id not in self.counsellor_notes:
            self.counsellor_notes[victim_id] = []
        self.counsellor_notes[victim_id].insert(0, note_data)

    def get_counsellor_notes(self, victim_id: str) -> List[Dict[str, Any]]:
        return self.counsellor_notes.get(victim_id, [])

db = AtrocityMonitoringDatabase()
