from fastapi import APIRouter, HTTPException, Form
from typing import List, Optional
from datetime import datetime
from app.database import db

router = APIRouter(prefix="/counsellor", tags=["Psychological Counsellor Workbench"])

@router.get("/case-file/{victim_id}")
async def get_counsellor_case_file(victim_id: str):
    victim = db.get_victim_by_id(victim_id)
    if not victim:
        raise HTTPException(status_code=404, detail="Victim not found")
        
    checkins = db.get_victim_checkins(victim_id)
    notes = db.get_counsellor_notes(victim_id)
    
    longitudinal_data = []
    for chk in checkins:
        longitudinal_data.append({
            "timestamp": chk["timestamp"][:10],
            "dds": chk["composite_dds"],
            "risk_level": chk["risk_level"],
            "voice_stress": chk.get("voice_metrics", {}).get("acoustic_stress_score", 0),
            "nlp_distress": chk.get("nlp_metrics", {}).get("nlp_distress_score", 0),
            "channel": chk.get("channel", "Web"),
            "transcript_snippet": (chk.get("transcript") or "")[:50] + "..." if chk.get("transcript") else ""
        })
        
    return {
        "victim_profile": victim,
        "longitudinal_trajectory": longitudinal_data,
        "latest_voice_spectrogram_biomarkers": checkins[-1].get("voice_metrics") if checkins else None,
        "latest_nlp_emotion_matrix": checkins[-1].get("nlp_metrics") if checkins else None,
        "clinical_notes_history": notes
    }

@router.post("/note")
async def add_clinical_counselling_note(
    victim_id: str = Form(...),
    counsellor_name: str = Form("Dr. A. Sharma (Senior Trauma Psychologist - NHAA)"),
    clinical_observations: str = Form(...),
    interventions_authorized: str = Form("Tele-MANAS trauma sessions, Witness protection requisition"),
    next_follow_up_days: int = Form(3)
):
    note = {
        "note_id": f"NOTE-{datetime.now().strftime('%Y%m%d%H%M%S')}",
        "victim_id": victim_id,
        "counsellor_name": counsellor_name,
        "timestamp": datetime.now().isoformat(),
        "clinical_observations": clinical_observations,
        "interventions_authorized": [i.strip() for i in interventions_authorized.split(",")],
        "next_follow_up_days": next_follow_up_days
    }
    db.add_counsellor_note(victim_id, note)
    return {"status": "success", "note": note}
