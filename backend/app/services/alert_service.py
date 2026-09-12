from typing import Dict, Any, List, Optional
from datetime import datetime

class AlertNotificationHub:
    def __init__(self):
        self.active_alerts: List[Dict[str, Any]] = []

    def create_alert(
        self,
        victim_id: str,
        victim_name: str,
        district: str,
        state: str,
        severity: str,
        trigger_reason: str,
        dds_score: float,
        escalation_delta: float,
        interventions: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        alert_id = f"ALT-{datetime.now().strftime('%Y%m%d%H%M%S')}-{victim_id[-4:]}"
        alert = {
            "alert_id": alert_id,
            "victim_id": victim_id,
            "victim_name": victim_name,
            "district": district,
            "state": state,
            "severity": severity,
            "trigger_reason": trigger_reason,
            "dds_score": dds_score,
            "escalation_delta": escalation_delta,
            "timestamp": datetime.now().isoformat(),
            "status": "ACTIVE",
            "assigned_officer": None,
            "interventions": interventions
        }
        self.active_alerts.insert(0, alert)
        return alert

    def get_all_alerts(self, limit: int = 50) -> List[Dict[str, Any]]:
        return self.active_alerts[:limit]

    def update_alert_status(self, alert_id: str, status: str, officer_name: Optional[str] = None) -> Optional[Dict[str, Any]]:
        for alert in self.active_alerts:
            if alert["alert_id"] == alert_id:
                alert["status"] = status
                if officer_name:
                    alert["assigned_officer"] = officer_name
                return alert
        return None

alert_hub = AlertNotificationHub()
