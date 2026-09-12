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
                "victim_id": "VIC-MP-881",
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
                "victim_id": "VIC-UP-409",
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
                "victim_id": "VIC-RJ-215",
                "victim_code": "SURVIVOR-RJ-215",
                "code_name": "SURVIVOR-RJ-215",
                "full_name_masked": "SURVIVOR-RJ-215",
                "state": "Rajasthan",
                "district": "Udaipur",
                "location": "GPS: 24.5854° N, 73.7125° E (Udaipur, Rajasthan)",
                "emergency_contact": "+91-98765-XXXX3",
                "current_risk_level": "RESOLVED",
                "current_dds": 32.0,
                "trend_status": "Protection Enforced & Resolved ✓",
                "summary": "Dwelling damaged after dispute over village common well. Protection enforced by district police."
            },
            {
                "victim_id": "VIC-MH-114",
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
                "victim_id": "VIC-TN-531",
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
                "victim_id": "VIC-BR-712",
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

        # Tailored unique case-specific voice and NLP metrics profiles
        case_profiles = {
            "VIC-MP-881": {
                "transcript": "Ghar ke bahar aaropi ke sathi ghoom rahe hain aur jaan se maarne ki dhamki de rahe hain. Case wapas lene ke liye keh rahe hain.",
                "voice": {
                    "pitch_mean_hz": 265.0, "pitch_volatility": 42.0, "jitter_pct": 4.2, "shimmer_pct": 12.8, "hnr_db": 8.5,
                    "pause_ratio": 0.44, "speech_tempo_syllables_sec": 2.2, "tremor_intensity": 86.0, "acoustic_stress_score": 88.0,
                    "acoustic_classification": "Severe Vocal Tremor & Acute Threat Constriction"
                },
                "nlp": {
                    "sentiment_polarity": -0.85, "fear_score": 92.0, "sadness_score": 65.0, "hopelessness_score": 78.0, "anger_score": 40.0,
                    "witness_threat_detected": True, "social_boycott_detected": False, "self_harm_ideation_detected": False,
                    "nlp_distress_score": 89.0, "extracted_threat_keywords": ["dhamki", "jaan se maarne", "case wapas"]
                }
            },
            "VIC-MH-114": {
                "transcript": "Court mein gawahi dene se rokne ke liye raat ko anjaan log aaye. Retraction papers par daskhat karne ki dhamki di.",
                "voice": {
                    "pitch_mean_hz": 238.0, "pitch_volatility": 36.0, "jitter_pct": 3.6, "shimmer_pct": 10.5, "hnr_db": 11.2,
                    "pause_ratio": 0.38, "speech_tempo_syllables_sec": 2.6, "tremor_intensity": 80.0, "acoustic_stress_score": 82.0,
                    "acoustic_classification": "High Vocal Strain & Intimidation Constriction"
                },
                "nlp": {
                    "sentiment_polarity": -0.75, "fear_score": 85.0, "sadness_score": 58.0, "hopelessness_score": 72.0, "anger_score": 35.0,
                    "witness_threat_detected": True, "social_boycott_detected": False, "self_harm_ideation_detected": False,
                    "nlp_distress_score": 84.0, "extracted_threat_keywords": ["gawahi", "retraction", "daskhat"]
                }
            },
            "VIC-UP-409": {
                "transcript": "Bail milne ke baad aaropi gaon mein ghoom raha hai. Raste par aate jaate gaaliyan aur darr ka mahol bana raha hai.",
                "voice": {
                    "pitch_mean_hz": 218.0, "pitch_volatility": 28.5, "jitter_pct": 2.8, "shimmer_pct": 8.4, "hnr_db": 14.1,
                    "pause_ratio": 0.32, "speech_tempo_syllables_sec": 3.0, "tremor_intensity": 68.0, "acoustic_stress_score": 71.0,
                    "acoustic_classification": "Elevated Vocal Tremor & Apprehensive Tension"
                },
                "nlp": {
                    "sentiment_polarity": -0.60, "fear_score": 78.0, "sadness_score": 62.0, "hopelessness_score": 60.0, "anger_score": 25.0,
                    "witness_threat_detected": True, "social_boycott_detected": False, "self_harm_ideation_detected": False,
                    "nlp_distress_score": 74.0, "extracted_threat_keywords": ["bail", "gaaliyan", "darr"]
                }
            },
            "VIC-RJ-215": {
                "transcript": "District police protection deployed. Ab gaon mein suraksha aur shanti hai.",
                "voice": {
                    "pitch_mean_hz": 185.0, "pitch_volatility": 12.0, "jitter_pct": 1.1, "shimmer_pct": 3.9, "hnr_db": 21.0,
                    "pause_ratio": 0.18, "speech_tempo_syllables_sec": 4.0, "tremor_intensity": 22.0, "acoustic_stress_score": 32.0,
                    "acoustic_classification": "Controlled Vocal Biomarkers (Protection Active)"
                },
                "nlp": {
                    "sentiment_polarity": 0.10, "fear_score": 25.0, "sadness_score": 30.0, "hopelessness_score": 20.0, "anger_score": 10.0,
                    "witness_threat_detected": False, "social_boycott_detected": False, "self_harm_ideation_detected": False,
                    "nlp_distress_score": 35.0, "extracted_threat_keywords": []
                }
            },
            "VIC-TN-531": {
                "transcript": "Physical injuries healing gradually. Still feeling apprehensive in dominant community neighborhood.",
                "voice": {
                    "pitch_mean_hz": 202.0, "pitch_volatility": 21.0, "jitter_pct": 1.9, "shimmer_pct": 5.8, "hnr_db": 16.8,
                    "pause_ratio": 0.25, "speech_tempo_syllables_sec": 3.4, "tremor_intensity": 42.0, "acoustic_stress_score": 48.0,
                    "acoustic_classification": "Moderate Acoustic Stress & Mild Volatility"
                },
                "nlp": {
                    "sentiment_polarity": -0.30, "fear_score": 50.0, "sadness_score": 45.0, "hopelessness_score": 38.0, "anger_score": 15.0,
                    "witness_threat_detected": False, "social_boycott_detected": False, "self_harm_ideation_detected": False,
                    "nlp_distress_score": 52.0, "extracted_threat_keywords": ["apprehensive"]
                }
            },
            "VIC-BR-712": {
                "transcript": "Zameen par kabza kar liya hai aur social boycott chal raha hai. Aarthik tangi aur nirasha hai.",
                "voice": {
                    "pitch_mean_hz": 228.0, "pitch_volatility": 31.0, "jitter_pct": 3.2, "shimmer_pct": 9.1, "hnr_db": 12.4,
                    "pause_ratio": 0.36, "speech_tempo_syllables_sec": 2.8, "tremor_intensity": 72.0, "acoustic_stress_score": 74.0,
                    "acoustic_classification": "High Vocal Distress & Hopeless Tremor"
                },
                "nlp": {
                    "sentiment_polarity": -0.70, "fear_score": 72.0, "sadness_score": 82.0, "hopelessness_score": 88.0, "anger_score": 30.0,
                    "witness_threat_detected": False, "social_boycott_detected": True, "self_harm_ideation_detected": False,
                    "nlp_distress_score": 77.0, "extracted_threat_keywords": ["kabza", "boycott", "nirasha"]
                }
            }
        }

        for case in seed_cases:
            vid = case["victim_id"]
            self.victims[vid] = case
            base_dds = case["current_dds"]
            prof = case_profiles.get(vid, case_profiles["VIC-MH-114"])
            history = []
            
            # W-3 (Baseline Follow-up)
            history.append({
                "checkin_id": f"CHK-{vid}-01",
                "victim_id": vid,
                "timestamp": (datetime.now() - timedelta(days=21)).isoformat(),
                "channel": "NHAA_14566_Call",
                "input_type": "Voice",
                "transcript": prof["transcript"],
                "voice_metrics": {
                    "pitch_mean_hz": round(prof["voice"]["pitch_mean_hz"] * 0.82, 1),
                    "pitch_volatility": 18.0,
                    "jitter_pct": 1.2,
                    "shimmer_pct": 4.1,
                    "hnr_db": 19.5,
                    "pause_ratio": 0.22,
                    "speech_tempo_syllables_sec": 3.8,
                    "tremor_intensity": round(prof["voice"]["tremor_intensity"] * 0.45, 1),
                    "acoustic_stress_score": round(prof["voice"]["acoustic_stress_score"] * 0.45, 1),
                    "acoustic_classification": "Moderate Tension / Controlled"
                },
                "nlp_metrics": {
                    "sentiment_polarity": -0.15,
                    "fear_score": round(prof["nlp"]["fear_score"] * 0.4, 1),
                    "sadness_score": 35.0,
                    "hopelessness_score": round(prof["nlp"]["hopelessness_score"] * 0.4, 1),
                    "anger_score": 15.0,
                    "witness_threat_detected": False,
                    "social_boycott_detected": False,
                    "self_harm_ideation_detected": False,
                    "nlp_distress_score": round(prof["nlp"]["nlp_distress_score"] * 0.45, 1),
                    "extracted_threat_keywords": []
                },
                "composite_dds": round(max(20.0, base_dds - 28.0), 1),
                "risk_level": "MODERATE",
                "explainable_summary": "Baseline follow-up."
            })
            
            # W-2 (Apprehension Phase)
            history.append({
                "checkin_id": f"CHK-{vid}-02",
                "victim_id": vid,
                "timestamp": (datetime.now() - timedelta(days=14)).isoformat(),
                "channel": "Mobile_App",
                "input_type": "Hybrid",
                "transcript": prof["transcript"],
                "voice_metrics": {
                    "pitch_mean_hz": round(prof["voice"]["pitch_mean_hz"] * 0.90, 1),
                    "pitch_volatility": 24.5,
                    "jitter_pct": 2.1,
                    "shimmer_pct": 6.8,
                    "hnr_db": 15.2,
                    "pause_ratio": 0.31,
                    "speech_tempo_syllables_sec": 3.1,
                    "tremor_intensity": round(prof["voice"]["tremor_intensity"] * 0.70, 1),
                    "acoustic_stress_score": round(prof["voice"]["acoustic_stress_score"] * 0.70, 1),
                    "acoustic_classification": "Elevated Nervous Strain"
                },
                "nlp_metrics": {
                    "sentiment_polarity": -0.45,
                    "fear_score": round(prof["nlp"]["fear_score"] * 0.7, 1),
                    "sadness_score": 45.0,
                    "hopelessness_score": round(prof["nlp"]["hopelessness_score"] * 0.7, 1),
                    "anger_score": 20.0,
                    "witness_threat_detected": False,
                    "social_boycott_detected": False,
                    "self_harm_ideation_detected": False,
                    "nlp_distress_score": round(prof["nlp"]["nlp_distress_score"] * 0.7, 1),
                    "extracted_threat_keywords": prof["nlp"]["extracted_threat_keywords"][:1]
                },
                "composite_dds": round(max(30.0, base_dds - 15.0), 1),
                "risk_level": "MODERATE",
                "explainable_summary": "Bail application apprehension."
            })
            
            # W-1 (Latest Check-in)
            history.append({
                "checkin_id": f"CHK-{vid}-03",
                "victim_id": vid,
                "timestamp": (datetime.now() - timedelta(days=5)).isoformat(),
                "channel": "Web_Portal",
                "input_type": "Voice",
                "transcript": prof["transcript"],
                "voice_metrics": prof["voice"],
                "nlp_metrics": prof["nlp"],
                "composite_dds": base_dds,
                "risk_level": case["current_risk_level"],
                "explainable_summary": f"Latest assessment: {prof['voice']['acoustic_classification']}."
            })
            
            self.checkins[vid] = history
            
            if case["current_risk_level"] in ["CRITICAL", "HIGH", "RESOLVED"]:
                is_resolved = case["current_risk_level"] == "RESOLVED"
                kw = ", ".join(prof["nlp"]["extracted_threat_keywords"]) if prof["nlp"]["extracted_threat_keywords"] else "Biomarker Assessment"
                reason = (
                    f"Protection Enforced & Case Resolved ✓ ({prof['voice']['acoustic_classification']})"
                    if is_resolved else
                    f"DDS Spiked to {base_dds}/100. {prof['voice']['acoustic_classification']}. Threat Cues: [{kw}]."
                )
                self.alerts.append({
                    "alert_id": f"ALT-INIT-{vid[-4:]}",
                    "victim_id": vid,
                    "victim_name": case["victim_code"],
                    "district": case["district"],
                    "state": case["state"],
                    "severity": case["current_risk_level"],
                    "trigger_reason": reason,
                    "dds_score": base_dds,
                    "escalation_delta": 24.0 if case["current_risk_level"] == "CRITICAL" else 14.0,
                    "timestamp": (datetime.now() - timedelta(hours=3)).isoformat(),
                    "status": "RESOLVED" if is_resolved else "ACTIVE",
                    "assigned_officer": "District SP / Special Protection Cell (Enforced)" if is_resolved else "DSP Special Cell (PoA) & DLVMC Nodal Team",
                    "interventions": [
                        {
                            "id": f"INT-{vid[-4:]}-1",
                            "title": "Armed Police Escort & Security Picket",
                            "act_section": "Sec 15A(6)(b) SC/ST (PoA) Act",
                            "target_authority": f"Superintendent of Police, {case['district']}",
                            "urgency": "ENFORCED" if is_resolved else "IMMEDIATE (Within 2h)"
                        },
                        {
                            "id": f"INT-{vid[-4:]}-2",
                            "title": "Emergency Tele-MANAS Psychological Consultation",
                            "act_section": "Rule 5(1)(e) PoA Rules",
                            "target_authority": "District Mental Health Officer",
                            "urgency": "COMPLETED" if is_resolved else "URGENT (Within 4h)"
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
        # Sync from Neon DB if connected and update local state cache
        try:
            from app.database_neon import neon_db
            if neon_db.is_connected:
                db_dockets = neon_db.get_all_dockets()
                if db_dockets:
                    for d in db_dockets:
                        vid = d["victim_id"]
                        if vid in self.victims:
                            self.victims[vid].update(d)
                        else:
                            self.victims[vid] = d
        except Exception:
            pass

        # Return consistent merged victims list (excluding transient unsubmitted intake sessions)
        return [
            v for v in self.victims.values()
            if v.get("current_risk_level") != "AWAITING INTAKE" or len(self.get_victim_checkins(v["victim_id"])) > 0
        ]

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
        user_text = checkin_data.get("transcript") or checkin_data.get("text_content") or checkin_data.get("user_message")
        if user_text and str(user_text).strip():
            self.victims[victim_id]["summary"] = str(user_text).strip()

        # Sync with Neon PostgreSQL if connected
        try:
            from app.database_neon import neon_db
            neon_db.sync_victim_case(self.victims[victim_id])
        except Exception:
            pass

    def add_counsellor_note(self, victim_id: str, note_data: Dict[str, Any]):
        if victim_id not in self.counsellor_notes:
            self.counsellor_notes[victim_id] = []
        self.counsellor_notes[victim_id].insert(0, note_data)

    def get_counsellor_notes(self, victim_id: str) -> List[Dict[str, Any]]:
        return self.counsellor_notes.get(victim_id, [])

db = AtrocityMonitoringDatabase()
