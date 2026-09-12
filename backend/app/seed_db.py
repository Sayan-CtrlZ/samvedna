"""
SAMVEDNA AI - Database Seeding & Verification Test Script
Pushes all hardcoded mock cases, alerts, statutory directives, and audit logs to the SQLite / Neon PostgreSQL database.
"""

import sys
import os
import json
from datetime import datetime

# Insert backend directory to path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.config import settings

# Default to local SQLite DB file for local verification if NEON_DATABASE_URL is not set or placeholder
if not os.getenv("NEON_DATABASE_URL") or "user:password" in os.getenv("NEON_DATABASE_URL", ""):
    db_path = os.path.join(backend_dir, "samvedna_authorities.db")
    os.environ["NEON_DATABASE_URL"] = f"sqlite:///{db_path}"

from app.database import db as in_memory_db
from app.database_neon import (
    NeonAuthorityDatabase,
    AuthorityCaseDocketModel,
    PoliceDispatchAlertModel,
    StatutoryDirectiveModel,
    AuthorityOfficerModel,
    AuthorityAuditLogModel
)

def run_db_seed_and_test():
    print("=" * 70)
    print(" SAMVEDNA AI - DATABASE PERSISTENCE SEEDING & TEST SUITE")
    print("=" * 70)

    neon_db = NeonAuthorityDatabase()
    print(f"[1] Database Connection Target: {neon_db.connection_url}")
    print(f"[2] Connection Status: {'SUCCESSFUL (Connected)' if neon_db.is_connected else 'FAILED'}")

    if not neon_db.is_connected or not neon_db.SessionLocal:
        print("ERROR: Database connection failed. Aborting test.")
        return False

    session = neon_db.SessionLocal()
    try:
        # 1. Seed Authority Officers
        print("\n--> [STEP 1] Seeding District Authority Officers...")
        officers = [
            AuthorityOfficerModel(
                id="OFF-SP-101",
                badge_number="SP-MH-4401",
                name="Shri R. K. Patil (IPS)",
                role="POLICE_SP",
                department="District Police HQ & Special Protection Cell",
                state="Maharashtra",
                district="Ahmednagar"
            ),
            AuthorityOfficerModel(
                id="OFF-MAG-202",
                badge_number="MAG-UP-1029",
                name="Smt. S. Verma (State Civil Services)",
                role="SPECIAL_MAGISTRATE",
                department="Section 15A Special Court",
                state="Uttar Pradesh",
                district="Hathras"
            ),
            AuthorityOfficerModel(
                id="OFF-PSY-303",
                badge_number="TM-PSY-8812",
                name="Dr. A. Sharma (Trauma Psychologist)",
                role="CLINICAL_COUNSELLOR",
                department="Tele-MANAS Tier-2 Cell (14416)",
                state="Madhya Pradesh",
                district="Morena"
            )
        ]
        for off in officers:
            if not session.query(AuthorityOfficerModel).filter_by(id=off.id).first():
                session.add(off)
        session.commit()
        print(f"    ✓ Inserted {len(officers)} official authority officer profiles.")

        # 2. Push Hardcoded Mock Victims/Cases from database.py to Database Table
        print("\n--> [STEP 2] Migrating Hardcoded Victim Cases to Database Table (authority_case_dockets)...")
        all_victims = in_memory_db.get_all_victims()
        inserted_cases_count = 0

        for vic in all_victims:
            vid = vic["victim_id"]
            existing = session.query(AuthorityCaseDocketModel).filter_by(victim_id=vid).first()
            if not existing:
                docket = AuthorityCaseDocketModel(
                    victim_id=vid,
                    victim_code=vic.get("victim_code", f"SURVIVOR-{vid[-4:]}"),
                    code_name=vic.get("code_name", f"SURVIVOR-{vid[-4:]}"),
                    state=vic.get("state", "Maharashtra"),
                    district=vic.get("district", "Ahmednagar"),
                    location=vic.get("location"),
                    current_risk_level=vic.get("current_risk_level", "MODERATE"),
                    current_dds=float(vic.get("current_dds", 50.0)),
                    trend_status=vic.get("trend_status", "Active Monitoring"),
                    summary=vic.get("summary", ""),
                    sections_invoked=vic.get("sections_invoked", "Section 3(1)(r), 3(1)(s) SC/ST PoA Act"),
                    accused_on_bail=vic.get("accused_on_bail", True),
                    compensation_delayed=vic.get("compensation_delayed", False),
                    needs_relocation=vic.get("needs_relocation", True),
                    legal_stage=vic.get("legal_stage", "Special Court Trial")
                )
                session.add(docket)
                inserted_cases_count += 1
            else:
                existing.current_dds = float(vic.get("current_dds", existing.current_dds))
                existing.current_risk_level = vic.get("current_risk_level", existing.current_risk_level)

        session.commit()
        print(f"    ✓ Migrated {len(all_victims)} victim cases into database table 'authority_case_dockets'.")

        # 3. Seed Real-time Police Dispatch Alerts
        print("\n--> [STEP 3] Seeding Police Dispatch Alerts Table (police_dispatch_alerts)...")
        alerts_data = [
            PoliceDispatchAlertModel(
                alert_id="ALT-MP-881",
                victim_id="VIC-MP-881",
                severity="CRITICAL",
                trigger_reason="DDS Spiked to 88.5/100. Witness intimidation cues & vocal tremor detected near residence.",
                district="Morena",
                state="Madhya Pradesh",
                status="ACTIVE",
                timestamp=datetime.utcnow()
            ),
            PoliceDispatchAlertModel(
                alert_id="ALT-MH-114",
                victim_id="VIC-MH-114",
                severity="CRITICAL",
                trigger_reason="DDS Spiked to 84.0/100. Unknown individuals approached victim attempting forced retraction.",
                district="Ahmednagar",
                state="Maharashtra",
                status="ACTIVE",
                timestamp=datetime.utcnow()
            ),
            PoliceDispatchAlertModel(
                alert_id="ALT-UP-409",
                victim_id="VIC-UP-409",
                severity="HIGH",
                trigger_reason="DDS Spiked to 74.0/100. High anxiety regarding threats received in village area.",
                district="Hathras",
                state="Uttar Pradesh",
                status="ACTIVE",
                timestamp=datetime.utcnow()
            )
        ]
        for alt in alerts_data:
            if not session.query(PoliceDispatchAlertModel).filter_by(alert_id=alt.alert_id).first():
                session.add(alt)
        session.commit()
        print(f"    ✓ Inserted {len(alerts_data)} emergency dispatch alerts into database.")

        # 4. Seed Statutory Protection Orders
        print("\n--> [STEP 4] Seeding Statutory Protection Directives (statutory_directives)...")
        directives = [
            StatutoryDirectiveModel(
                directive_id="DIR-881-01",
                victim_id="VIC-MP-881",
                action_type="ARMED_POLICE_PICKET",
                title="Armed Police Picket at Residence (Sec 15A(6)(b))",
                statutory_act_section="Sec 15A(6)(b) SC/ST (PoA) Act",
                issuing_authority="District Nodal Officer / SP Morena",
                target_authority="Station House Officer, Morena PS",
                urgency="IMMEDIATE (Within 2h)",
                status="ENFORCED"
            ),
            StatutoryDirectiveModel(
                directive_id="DIR-114-02",
                victim_id="VIC-MH-114",
                action_type="COURT_ESCORT_PATROL",
                title="Armed Escort During Court Deposition (Sec 15A(6)(c))",
                statutory_act_section="Sec 15A(6)(c) SC/ST (PoA) Act",
                issuing_authority="Special Judge, Ahmednagar Court",
                target_authority="Superintendent of Police, Ahmednagar",
                urgency="URGENT (Within 4h)",
                status="IN_PROGRESS"
            )
        ]
        for dir_item in directives:
            if not session.query(StatutoryDirectiveModel).filter_by(directive_id=dir_item.directive_id).first():
                session.add(dir_item)
        session.commit()
        print(f"    ✓ Inserted {len(directives)} statutory protection directives into database.")

        # 5. Insert Audit Log
        print("\n--> [STEP 5] Recording Immutability Compliance Audit Log...")
        audit = AuthorityAuditLogModel(
            id=f"AUD-{int(datetime.utcnow().timestamp())}",
            officer_badge="SP-MH-4401",
            action="MOCK_DATA_MIGRATION_VERIFIED",
            target_victim_id="ALL",
            details_json=json.dumps({"seeded_records": len(all_victims), "timestamp": str(datetime.utcnow())})
        )
        session.add(audit)
        session.commit()
        print("    ✓ Recorded compliance audit log in 'authority_audit_logs'.")

        # 6. Verification Queries
        print("\n" + "=" * 70)
        print(" VERIFICATION: QUERYING DATABASE TABLES")
        print("=" * 70)

        db_dockets = session.query(AuthorityCaseDocketModel).all()
        print(f"\n[TABLE: authority_case_dockets] Count = {len(db_dockets)} records:")
        for d in db_dockets:
            print(f"  • {d.victim_id} | Code: {d.victim_code} | State: {d.state} ({d.district}) | DDS: {d.current_dds} | Risk: {d.current_risk_level}")

        db_alerts = session.query(PoliceDispatchAlertModel).all()
        print(f"\n[TABLE: police_dispatch_alerts] Count = {len(db_alerts)} active alerts:")
        for a in db_alerts:
            print(f"  • Alert {a.alert_id} | Victim: {a.victim_id} | Severity: {a.severity} | Status: {a.status}")

        db_officers = session.query(AuthorityOfficerModel).all()
        print(f"\n[TABLE: authority_officers] Count = {len(db_officers)} registered officers:")
        for o in db_officers:
            print(f"  • Badge: {o.badge_number} | Name: {o.name} | Role: {o.role} | Dept: {o.department}")

        print("\n" + "=" * 70)
        print(" SUCCESS: ALL MOCK DATA PUSHED & VERIFIED IN DATABASE!")
        print("=" * 70)
        return True

    except Exception as e:
        session.rollback()
        print(f"\nERROR during database test: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        session.close()

if __name__ == "__main__":
    run_db_seed_and_test()
