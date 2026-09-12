from typing import List, Dict, Any

class AutomatedInterventionRecommender:
    def recommend(
        self,
        risk_level: str,
        threat_detected: bool,
        social_boycott: bool,
        self_harm: bool,
        case_stage: str,
        case_data: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        interventions = []
        
        if threat_detected or risk_level == "CRITICAL":
            interventions.append({
                "id": "INT-PROT-01",
                "title": "Deploy Immediate Armed Police Escort & Residence Picket",
                "act_section": "Section 15A(6)(b) SC/ST (PoA) Act",
                "target_authority": "Superintendent of Police (SP) / Police Nodal Officer",
                "urgency": "IMMEDIATE (Within 2 Hours)",
                "category": "WITNESS_PROTECTION",
                "description": "Deploy 24x7 security personnel at victim/witness residence and install CCTV/patrolling log."
            })
            
        if threat_detected and case_data.get("needs_relocation", False):
            interventions.append({
                "id": "INT-RELOC-02",
                "title": "Emergency Safe House Relocation & Temporary Shelter",
                "act_section": "Section 15A(6)(c) SC/ST (PoA) Act",
                "target_authority": "District Magistrate (DM) / Social Welfare Department",
                "urgency": "HIGH (24 Hours)",
                "category": "SAFE_SHELTER",
                "description": "Authorize safe transit and accommodation in designated secure facility away from threat zone."
            })

        if self_harm or risk_level in ["CRITICAL", "HIGH"]:
            interventions.append({
                "id": "INT-PSYC-03",
                "title": "Urgent Tele-MANAS / DMHP Psychiatric Emergency Visit",
                "act_section": "Rule 5(1)(e) PoA Rules - Medical & Psychological Care",
                "target_authority": "District Mental Health Programme (DMHP) Officer / Tele-MANAS",
                "urgency": "URGENT (Within 4 Hours)",
                "category": "PSYCHIATRIC_CARE",
                "description": "Assign clinical trauma psychologist for home or secure video evaluation and crisis de-escalation."
            })
        elif risk_level == "MODERATE":
            interventions.append({
                "id": "INT-COUN-04",
                "title": "Scheduled Bi-Weekly Supportive Trauma Counselling",
                "act_section": "NHAA 14566 Psycho-Social Support Protocol",
                "target_authority": "NHAA Helpline Specialised Counsellor",
                "urgency": "ROUTINE (Within 48 Hours)",
                "category": "TELE_COUNSELLING",
                "description": "Conduct structured supportive session focusing on grounding techniques and trial coping strategies."
            })

        if case_data.get("compensation_delayed", True) or risk_level in ["HIGH", "CRITICAL"]:
            interventions.append({
                "id": "INT-COMP-05",
                "title": "Fast-Track Interim Relief Grant (50% / 100% Milestone)",
                "act_section": "Annexure I (Schedule) PoA Rules - Relief & Rehabilitation",
                "target_authority": "District Magistrate & District Welfare Officer",
                "urgency": "PRIORITY (3 Business Days)",
                "category": "INTERIM_RELIEF",
                "description": "Direct electronic benefit transfer (DBT) of statutory relief amount to prevent economic coercion."
            })

        if "Trial" in case_stage or "Witness" in case_stage or threat_detected:
            interventions.append({
                "id": "INT-LEGAL-06",
                "title": "Assign Senior Legal Aid Counsel & In-Camera Trial Requisition",
                "act_section": "Section 15A(10) SC/ST (PoA) Act & NALSA Scheme",
                "target_authority": "District Legal Services Authority (DLSA) Secretary",
                "urgency": "HIGH",
                "category": "LEGAL_AID",
                "description": "Provide dedicated Special Public Prosecutor coordination and file motion for video-link deposition."
            })
            
        if social_boycott:
            interventions.append({
                "id": "INT-SOC-07",
                "title": "District Magistrate Peace Committee & Restitution Order",
                "act_section": "Section 17 SC/ST (PoA) Act - Precautionary Measures",
                "target_authority": "Sub-Divisional Magistrate (SDM) / Tehsildar",
                "urgency": "IMMEDIATE",
                "category": "COMMUNITY_RESTITUTION",
                "description": "Issue binding order against caste boycott and restore essential utility and ration access."
            })
            
        return interventions

intervention_engine = AutomatedInterventionRecommender()
