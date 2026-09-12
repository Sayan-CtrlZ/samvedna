from fastapi import APIRouter, Query, Form
from typing import Optional, List, Dict, Any
from app.database import db

router = APIRouter(prefix="/dashboard", tags=["Government & District Triage Dashboard"])

@router.get("/metrics")
@router.get("/overview")
async def get_summary_metrics(
    state: Optional[str] = None,
    district: Optional[str] = None
):
    all_victims = db.get_all_victims()
    
    if state and state != "ALL":
        all_victims = [v for v in all_victims if v["state"].lower() == state.lower()]
    if district and district != "ALL":
        all_victims = [v for v in all_victims if v["district"].lower() == district.lower()]
        
    total_victims = len(all_victims)
    critical_count = sum(1 for v in all_victims if v["current_risk_level"] == "CRITICAL")
    high_count = sum(1 for v in all_victims if v["current_risk_level"] == "HIGH")
    moderate_count = sum(1 for v in all_victims if v["current_risk_level"] == "MODERATE")
    low_count = sum(1 for v in all_victims if v["current_risk_level"] in ["LOW", "STABLE"])
    resolved_count = sum(1 for v in all_victims if v["current_risk_level"] in ["RESOLVED", "CLOSED", "ENFORCED"])
    
    avg_dds = round(sum(v["current_dds"] for v in all_victims) / max(1, total_victims), 1)
    
    stage_breakdown = {}
    for v in all_victims:
        stage = v.get("legal_stage", "Other")
        stage_breakdown[stage] = stage_breakdown.get(stage, 0) + 1
        
    bail_risk_count = sum(1 for v in all_victims if v.get("accused_on_bail", False))
    comp_delayed_count = sum(1 for v in all_victims if v.get("compensation_delayed", False))
    reloc_needed_count = sum(1 for v in all_victims if v.get("needs_relocation", False))
    
    return {
        "total_monitored_cases": total_victims,
        "critical_cases": critical_count,
        "high_risk_cases": high_count,
        "moderate_risk_cases": moderate_count,
        "stable_cases": low_count,
        "resolved_cases": resolved_count,
        "average_distress_index": avg_dds,
        "stage_breakdown": stage_breakdown,
        "vulnerability_flags": {
            "accused_out_on_bail": bail_risk_count,
            "compensation_delayed": comp_delayed_count,
            "relocation_required": reloc_needed_count
        }
    }

@router.get("/cases")
async def get_triage_case_queue(
    risk_filter: Optional[str] = Query(None, description="CRITICAL, HIGH, MODERATE, LOW, STABLE, RESOLVED, ALL"),
    search: Optional[str] = None
):
    cases = db.get_all_victims()
    
    if risk_filter and risk_filter != "ALL":
        if risk_filter == "RESOLVED":
            cases = [c for c in cases if c["current_risk_level"] in ["RESOLVED", "CLOSED", "ENFORCED"]]
        elif risk_filter == "STABLE":
            cases = [c for c in cases if c["current_risk_level"] in ["LOW", "STABLE"]]
        else:
            cases = [c for c in cases if c["current_risk_level"] == risk_filter]
        
    if search:
        s = search.lower()
        cases = [c for c in cases if s in c["victim_id"].lower() or s in c["district"].lower() or s in c["state"].lower() or s in c.get("summary", "").lower()]
        
    priority_order = {"CRITICAL": 0, "HIGH": 1, "MODERATE": 2, "LOW": 3, "STABLE": 3, "RESOLVED": 4}
    cases.sort(key=lambda x: (priority_order.get(x["current_risk_level"], 5), -x["current_dds"]))
    
    return {
        "count": len(cases),
        "cases": cases
    }

@router.post("/case/resolve")
async def resolve_case(
    victim_id: str = Form(...),
    officer_name: str = Form("District SP / Special Protection Cell"),
    resolution_notes: str = Form("Protection Enforced & Threat Resolved under Sec 15A PoA Act")
):
    """Allows police / authorities to mark witness protection case as RESOLVED."""
    victim = db.victims.get(victim_id)
    if victim:
        victim["current_risk_level"] = "RESOLVED"
        victim["trend_status"] = "Protection Enforced & Resolved ✓"
        victim["summary"] = f"{victim.get('summary', '')} | RESOLVED by {officer_name}"

    # Also resolve all active emergency alerts associated with this victim_id
    for alert in db.alerts:
        if alert.get("victim_id") == victim_id:
            alert["status"] = "RESOLVED"
            alert["assigned_officer"] = officer_name

    try:
        from app.services.alert_service import alert_hub
        for alert in alert_hub.active_alerts:
            if alert.get("victim_id") == victim_id:
                alert["status"] = "RESOLVED"
                alert["assigned_officer"] = officer_name
    except Exception:
        pass

    try:
        from app.database_neon import neon_db, AuthorityCaseDocketModel, PoliceDispatchAlertModel
        if neon_db.is_connected and neon_db.SessionLocal:
            session = neon_db.SessionLocal()
            try:
                docket = session.query(AuthorityCaseDocketModel).filter_by(victim_id=victim_id).first()
                if docket:
                    docket.current_risk_level = "RESOLVED"
                    docket.trend_status = "Protection Enforced & Resolved ✓"

                alerts = session.query(PoliceDispatchAlertModel).filter_by(victim_id=victim_id).all()
                for a in alerts:
                    a.status = "RESOLVED"
                    a.dispatched_by = officer_name

                session.commit()
            except Exception:
                session.rollback()
            finally:
                session.close()
    except Exception:
        pass

    return {
        "status": "success",
        "victim_id": victim_id,
        "current_risk_level": "RESOLVED",
        "message": f"Case {victim_id} marked as RESOLVED by {officer_name}."
    }

