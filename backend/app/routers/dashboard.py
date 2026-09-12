from fastapi import APIRouter, Query
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
    low_count = sum(1 for v in all_victims if v["current_risk_level"] == "LOW")
    
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
    risk_filter: Optional[str] = Query(None, description="CRITICAL, HIGH, MODERATE, LOW, ALL"),
    search: Optional[str] = None
):
    cases = db.get_all_victims()
    
    if risk_filter and risk_filter != "ALL":
        cases = [c for c in cases if c["current_risk_level"] == risk_filter]
        
    if search:
        s = search.lower()
        cases = [c for c in cases if s in c["victim_id"].lower() or s in c["district"].lower() or s in c["state"].lower() or s in c["sections_invoked"].lower()]
        
    priority_order = {"CRITICAL": 0, "HIGH": 1, "MODERATE": 2, "LOW": 3}
    cases.sort(key=lambda x: (priority_order.get(x["current_risk_level"], 4), -x["current_dds"]))
    
    return {
        "count": len(cases),
        "cases": cases
    }
