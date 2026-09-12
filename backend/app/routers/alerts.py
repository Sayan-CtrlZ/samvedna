from fastapi import APIRouter, Form
from typing import Optional
from datetime import datetime
from app.services.alert_service import alert_hub
from app.database import db

router = APIRouter(prefix="/alerts", tags=["Emergency Alerts & Dispatch"])

@router.get("/feed")
async def get_live_alerts_feed(limit: int = 30):
    all_combined = alert_hub.active_alerts + db.alerts
    # Deduplicate by alert_id
    seen = set()
    deduped = []
    for a in all_combined:
        if a["alert_id"] not in seen:
            seen.add(a["alert_id"])
            deduped.append(a)
            
    # Sort with EMERGENCY_SOS and CRITICAL first, then by timestamp
    order = {"EMERGENCY_SOS": 0, "CRITICAL": 1, "HIGH": 2, "MODERATE": 3, "LOW": 4}
    deduped.sort(key=lambda x: (0 if x["status"] == "ACTIVE" else 1, order.get(x["severity"], 5), x.get("timestamp", "")), reverse=False)
    
    return {
        "alerts": deduped[:limit],
        "total_active": sum(1 for a in deduped if a["status"] == "ACTIVE")
    }

@router.post("/acknowledge")
async def acknowledge_alert(
    alert_id: str = Form(...),
    officer_name: str = Form("Superintendent of Police / Special Duty Magistrate"),
    action_taken: str = Form("Dispatched Armed Picket & Assigned Nodal Officer")
):
    # Check alert_hub
    updated = alert_hub.update_alert_status(alert_id, "DISPATCHED", officer_name)
    if not updated:
        # Check db.alerts
        for a in db.alerts:
            if a["alert_id"] == alert_id:
                a["status"] = "DISPATCHED"
                a["assigned_officer"] = officer_name
                updated = a
                break
                
    return {
        "status": "DISPATCHED",
        "alert": updated,
        "action_taken": action_taken,
        "timestamp": datetime.now().isoformat()
    }

@router.post("/resolve")
async def resolve_alert(
    alert_id: str = Form(...),
    officer_name: str = Form("District SP / Special Protection Cell")
):
    updated = alert_hub.update_alert_status(alert_id, "RESOLVED", officer_name)
    if not updated:
        for a in db.alerts:
            if a["alert_id"] == alert_id:
                a["status"] = "RESOLVED"
                a["assigned_officer"] = officer_name
                updated = a
                break
    return {
        "status": "RESOLVED",
        "alert": updated,
        "timestamp": datetime.now().isoformat()
    }

