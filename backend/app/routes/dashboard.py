"""
routes/dashboard.py

GET  /dashboard               – Aggregate stats from PostgreSQL
GET  /dashboard/high-risk-assets – All assets ranked by risk score (descending)
"""

from fastapi import APIRouter, HTTPException
from ..services import postgres_service

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"],
)


@router.get("/")
def get_dashboard():
    """
    Returns top-level KPIs computed from PostgreSQL.

    {
        "total_assets": 25,
        "total_work_orders": 500,
        "total_incidents": 100,
        "total_inspections": 50,
        "high_risk_assets": 8,
        "knowledge_gaps": 12,
        "preventable_failures": 75,
        "top_failure_mode": "Bearing Failure"
    }
    """
    try:
        return postgres_service.get_dashboard_stats()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/high-risk-assets")
def get_high_risk_assets():
    """
    Returns ALL equipment ranked by risk score (descending).

    risk_score = incident_count * 0.4
               + avg_inspection_risk * 0.4
               + open_followups * 0.2

    Risk levels:
        90-100 → Critical
        70-89  → High
        40-69  → Medium
        0-39   → Low

    [
        { "equipment_id": "PMP-CW-101", "risk_score": 91.0, "risk_level": "Critical" },
        ...
    ]
    """
    try:
        return postgres_service.get_all_equipment_risk_scores()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
