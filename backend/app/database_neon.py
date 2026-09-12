"""
SAMVEDNA AI - Neon PostgreSQL Database Module (Authorities & District Sentinel Portal)
Sec 15A SC/ST PoA Act Statutory Compliance, Police Dispatch Roster, and Audit Trail.
"""

import os
import json
import logging
from datetime import datetime
from typing import Dict, Any, List, Optional

from app.config import settings

logger = logging.getLogger("samvedna.database_neon")

# Check if SQLAlchemy is available
try:
    from sqlalchemy import (
        create_engine, Column, String, Float, Boolean, DateTime, Text, ForeignKey, JSON
    )
    from sqlalchemy.orm import declarative_base, sessionmaker, relationship
    HAS_SQLALCHEMY = True
except ImportError:
    HAS_SQLALCHEMY = False

Base = declarative_base() if HAS_SQLALCHEMY else object


if HAS_SQLALCHEMY:
    class AuthorityOfficerModel(Base):
        __tablename__ = "authority_officers"

        id = Column(String(50), primary_key=True)
        badge_number = Column(String(50), unique=True, nullable=False)
        name = Column(String(100), nullable=False)
        role = Column(String(50), nullable=False)  # POLICE_SP, SPECIAL_MAGISTRATE, CLINICAL_COUNSELLOR
        department = Column(String(100), nullable=False)
        state = Column(String(50), nullable=False)
        district = Column(String(50), nullable=False)
        created_at = Column(DateTime, default=datetime.utcnow)

    class AuthorityCaseDocketModel(Base):
        __tablename__ = "authority_case_dockets"

        victim_id = Column(String(50), primary_key=True)
        victim_code = Column(String(50), nullable=False)
        code_name = Column(String(100), nullable=False)
        state = Column(String(50), nullable=False)
        district = Column(String(50), nullable=False)
        location = Column(Text, nullable=True)
        current_risk_level = Column(String(20), default="MODERATE")
        current_dds = Column(Float, default=50.0)
        trend_status = Column(String(100), nullable=True)
        summary = Column(Text, nullable=True)
        sections_invoked = Column(String(200), default="Section 3(1)(r), 3(1)(s) SC/ST PoA Act")
        accused_on_bail = Column(Boolean, default=False)
        compensation_delayed = Column(Boolean, default=False)
        needs_relocation = Column(Boolean, default=False)
        legal_stage = Column(String(50), default="Special Court Trial")
        created_at = Column(DateTime, default=datetime.utcnow)
        updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    class PoliceDispatchAlertModel(Base):
        __tablename__ = "police_dispatch_alerts"

        alert_id = Column(String(50), primary_key=True)
        victim_id = Column(String(50), ForeignKey("authority_case_dockets.victim_id"), nullable=False)
        severity = Column(String(20), default="HIGH")  # CRITICAL, EMERGENCY_SOS, HIGH, MODERATE
        trigger_reason = Column(Text, nullable=False)
        district = Column(String(50), nullable=False)
        state = Column(String(50), nullable=False)
        status = Column(String(20), default="ACTIVE")  # ACTIVE, DISPATCHED, RESOLVED
        dispatched_by = Column(String(100), nullable=True)
        dispatched_at = Column(DateTime, nullable=True)
        timestamp = Column(DateTime, default=datetime.utcnow)

    class StatutoryDirectiveModel(Base):
        __tablename__ = "statutory_directives"

        directive_id = Column(String(50), primary_key=True)
        victim_id = Column(String(50), ForeignKey("authority_case_dockets.victim_id"), nullable=False)
        action_type = Column(String(50), nullable=False)  # ARMED_POLICE_PICKET, COURT_ESCORT_PATROL, RELOCATION_SAFEHOUSE
        title = Column(String(200), nullable=False)
        statutory_act_section = Column(String(100), default="Section 15A(6)(b) SC/ST PoA Act")
        issuing_authority = Column(String(100), nullable=False)
        target_authority = Column(String(100), nullable=False)
        urgency = Column(String(50), default="IMMEDIATE (Within 2h)")
        status = Column(String(20), default="ISSUED")  # ISSUED, IN_PROGRESS, ENFORCED
        created_at = Column(DateTime, default=datetime.utcnow)

    class AuthorityAuditLogModel(Base):
        __tablename__ = "authority_audit_logs"

        id = Column(String(50), primary_key=True)
        officer_badge = Column(String(50), nullable=False)
        action = Column(String(100), nullable=False)
        target_victim_id = Column(String(50), nullable=True)
        details_json = Column(Text, nullable=True)
        timestamp = Column(DateTime, default=datetime.utcnow)


class NeonAuthorityDatabase:
    """Neon PostgreSQL Database Manager with fallback to in-memory mode."""

    def __init__(self):
        self.engine = None
        self.SessionLocal = None
        self.is_connected = False
        self.connection_url = os.getenv("NEON_DATABASE_URL", os.getenv("DATABASE_URL", None))
        self._initialize_connection()

    def _initialize_connection(self):
        if not HAS_SQLALCHEMY or not self.connection_url:
            logger.info("NeonDB: NEON_DATABASE_URL not set or SQLAlchemy missing. Operating in in-memory mode.")
            return

        try:
            url = self.connection_url.strip()
            # Convert postgres:// to postgresql:// for SQLAlchemy 2.0
            if url.startswith("postgres://"):
                url = url.replace("postgres://", "postgresql://", 1)

            self.engine = create_engine(url, pool_pre_ping=True, pool_size=5, max_overflow=10)
            self.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)
            Base.metadata.create_all(bind=self.engine)
            self.is_connected = True
            logger.info("NeonDB: Successfully connected to Neon PostgreSQL Database.")
            self._seed_default_data_if_empty()
        except Exception as e:
            logger.warning(f"NeonDB: Connection to Neon PostgreSQL failed ({e}). Falling back to local mode.")
            self.is_connected = False

    def _seed_default_data_if_empty(self):
        if not self.is_connected or not self.SessionLocal:
            return
        session = self.SessionLocal()
        try:
            count = session.query(AuthorityCaseDocketModel).count()
            if count == 0:
                seed_dockets = [
                    AuthorityCaseDocketModel(
                        victim_id="VIC-MP-881",
                        victim_code="SURVIVOR-MP-881",
                        code_name="SURVIVOR-MP-881",
                        state="Madhya Pradesh",
                        district="Morena",
                        location="GPS: 26.4980° N, 77.9940° E (Morena, Madhya Pradesh)",
                        current_risk_level="CRITICAL",
                        current_dds=88.5,
                        trend_status="Acute Crisis Spike (+24 pts)",
                        summary="Threats and intimidation experienced outside home. Accused associates approaching family.",
                        sections_invoked="Section 3(1)(r), 3(1)(s), 3(2)(va) SC/ST PoA Act",
                        accused_on_bail=True,
                        compensation_delayed=False,
                        needs_relocation=True,
                        legal_stage="Bail Challenge in High Court"
                    ),
                    AuthorityCaseDocketModel(
                        victim_id="VIC-UP-409",
                        victim_code="COMPLAINANT-UP-409",
                        code_name="COMPLAINANT-UP-409",
                        state="Uttar Pradesh",
                        district="Hathras",
                        location="GPS: 27.5950° N, 78.0500° E (Hathras, Uttar Pradesh)",
                        current_risk_level="HIGH",
                        current_dds=74.0,
                        trend_status="Escalating Distress (+14 pts)",
                        summary="High anxiety regarding threats received in village area.",
                        sections_invoked="Section 3(1)(w), 3(2)(v) SC/ST PoA Act",
                        accused_on_bail=False,
                        compensation_delayed=True,
                        needs_relocation=False,
                        legal_stage="Investigation & Charge Sheet"
                    ),
                    AuthorityCaseDocketModel(
                        victim_id="VIC-RJ-215",
                        victim_code="SURVIVOR-RJ-215",
                        code_name="SURVIVOR-RJ-215",
                        state="Rajasthan",
                        district="Udaipur",
                        location="GPS: 24.5854° N, 73.7125° E (Udaipur, Rajasthan)",
                        current_risk_level="HIGH",
                        current_dds=68.5,
                        trend_status="Social Boycott & Harassment (+16 pts)",
                        summary="Dwelling damaged after dispute over village common well. Facing village social boycott.",
                        sections_invoked="Section 3(1)(z), 3(1)(f) SC/ST PoA Act",
                        accused_on_bail=True,
                        compensation_delayed=True,
                        needs_relocation=False,
                        legal_stage="Special Court Trial"
                    ),
                    AuthorityCaseDocketModel(
                        victim_id="VIC-MH-114",
                        victim_code="SURVIVOR-MH-114",
                        code_name="SURVIVOR-MH-114",
                        state="Maharashtra",
                        district="Ahmednagar",
                        location="GPS: 19.0948° N, 74.7480° E (Ahmednagar, Maharashtra)",
                        current_risk_level="CRITICAL",
                        current_dds=84.0,
                        trend_status="Witness Intimidation Spike (+26 pts)",
                        summary="Approached by unknown individuals attempting to force signing retraction documents.",
                        sections_invoked="Section 3(1)(r), 3(2)(va) SC/ST PoA Act",
                        accused_on_bail=True,
                        compensation_delayed=False,
                        needs_relocation=True,
                        legal_stage="Eyewitness Examination"
                    )
                ]
                session.add_all(seed_dockets)
                session.commit()
                logger.info("NeonDB: Seeded initial authority case dockets.")
        except Exception as e:
            session.rollback()
            logger.error(f"NeonDB: Seeding failed: {e}")
        finally:
            session.close()

    def sync_victim_case(self, case_data: Dict[str, Any]):
        """Persists or updates authority case docket in Neon PostgreSQL."""
        if not self.is_connected or not self.SessionLocal:
            return

        session = self.SessionLocal()
        try:
            vid = case_data.get("victim_id")
            if not vid:
                return

            docket = session.query(AuthorityCaseDocketModel).filter_by(victim_id=vid).first()
            if not docket:
                docket = AuthorityCaseDocketModel(
                    victim_id=vid,
                    victim_code=case_data.get("victim_code", f"SURVIVOR-{vid[-4:]}"),
                    code_name=case_data.get("code_name", f"SURVIVOR-{vid[-4:]}"),
                    state=case_data.get("state", "Maharashtra"),
                    district=case_data.get("district", "Ahmednagar"),
                    location=case_data.get("location"),
                    current_risk_level=case_data.get("current_risk_level", "MODERATE"),
                    current_dds=float(case_data.get("current_dds", 50.0)),
                    trend_status=case_data.get("trend_status", "Active Intake"),
                    summary=case_data.get("summary", ""),
                    sections_invoked=case_data.get("sections_invoked", "Section 3 SC/ST PoA Act"),
                    accused_on_bail=case_data.get("accused_on_bail", False),
                    compensation_delayed=case_data.get("compensation_delayed", False),
                    needs_relocation=case_data.get("needs_relocation", False)
                )
                session.add(docket)
            else:
                docket.current_risk_level = case_data.get("current_risk_level", docket.current_risk_level)
                docket.current_dds = float(case_data.get("current_dds", docket.current_dds))
                docket.trend_status = case_data.get("trend_status", docket.trend_status)
                if case_data.get("summary"):
                    docket.summary = case_data["summary"]
                if case_data.get("location"):
                    docket.location = case_data["location"]

            session.commit()
        except Exception as e:
            session.rollback()
            logger.error(f"NeonDB: Failed syncing victim case {case_data.get('victim_id')}: {e}")
        finally:
            session.close()

    def get_all_dockets(self) -> List[Dict[str, Any]]:
        if not self.is_connected or not self.SessionLocal:
            return []
        session = self.SessionLocal()
        try:
            dockets = session.query(AuthorityCaseDocketModel).all()
            return [
                {
                    "victim_id": d.victim_id,
                    "victim_code": d.victim_code,
                    "code_name": d.code_name,
                    "state": d.state,
                    "district": d.district,
                    "location": d.location,
                    "current_risk_level": d.current_risk_level,
                    "current_dds": d.current_dds,
                    "trend_status": d.trend_status,
                    "summary": d.summary,
                    "sections_invoked": d.sections_invoked,
                    "accused_on_bail": d.accused_on_bail,
                    "compensation_delayed": d.compensation_delayed,
                    "needs_relocation": d.needs_relocation,
                    "legal_stage": d.legal_stage
                }
                for d in dockets
            ]
        finally:
            session.close()

neon_db = NeonAuthorityDatabase()
