from fastapi import APIRouter
from sqlalchemy import text

from app.db import engine

router = APIRouter(
    prefix="/insights",
    tags=["Insights"]
)


@router.get("/knowledge-gaps")
def knowledge_gaps():

    gaps = []

    with engine.connect() as conn:

        inspections = conn.execute(
            text("""
                SELECT
                    inspection_id,
                    equipment_id,
                    inspection_date,
                    finding,
                    recommendation,
                    risk_score,
                    follow_up_required
                FROM inspection_report
                ORDER BY risk_score DESC
            """)
        ).fetchall()

        for inspection in inspections:

            incident_count = conn.execute(
                text("""
                    SELECT COUNT(*)
                    FROM incident_report
                    WHERE equipment_id = :equipment_id
                """),
                {
                    "equipment_id": inspection.equipment_id
                }
            ).scalar()

            if (
                inspection.follow_up_required == "Yes"
                and inspection.risk_score >= 75
                and incident_count > 0
            ):

                common_failure = conn.execute(
                    text("""
                        SELECT failure_mode
                        FROM incident_report
                        WHERE equipment_id = :equipment_id
                        GROUP BY failure_mode
                        ORDER BY COUNT(*) DESC
                        LIMIT 1
                    """),
                    {
                        "equipment_id": inspection.equipment_id
                    }
                ).scalar()

                if inspection.risk_score >= 85:
                    risk = "Critical"
                elif inspection.risk_score >= 75:
                    risk = "High"
                else:
                    risk = "Medium"

                gaps.append({
                    "equipment_id": inspection.equipment_id,
                    "inspection_id": inspection.inspection_id,
                    "inspection_date": inspection.inspection_date,
                    "risk_score": inspection.risk_score,
                    "finding": inspection.finding,
                    "recommendation": inspection.recommendation,
                    "follow_up_required": inspection.follow_up_required,
                    "incident_history": incident_count,
                    "common_failure_mode": common_failure,
                    "risk": risk,
                    "insight": "Potentially Preventable Failure"
                })

        total_incidents = conn.execute(
            text("""
                SELECT COUNT(*)
                FROM incident_report
            """)
        ).scalar()

        return {
            "total_incidents": total_incidents,
            "knowledge_gaps": len(gaps),
            "preventable_failure_rate": round(
                (len(gaps) / total_incidents) * 100,
                2
            ) if total_incidents else 0,
            "gaps": gaps
        }


@router.get("/knowledge-gaps/summary")
def knowledge_gaps_summary():
    """
    High-level summary of knowledge gaps.

    {
        "total_gaps": 14,
        "preventable_failure_rate": 78.0,
        "top_assets": ["PMP-CW-101", "MTR-CW-102"]
    }
    """
    from ..services.postgres_service import get_knowledge_gap_summary
    try:
        return get_knowledge_gap_summary()
    except Exception as exc:
        from fastapi import HTTPException
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/executive")
def executive_insights():
    """
    AI-derived executive summary from real PostgreSQL data.

    {
        "highest_risk_asset": "PMP-CW-101",
        "most_common_failure_mode": "Bearing Failure",
        "preventable_failures": 75,
        "avg_risk_score": 72.0,
        "recommended_action": "Focus predictive maintenance on pumps..."
    }
    """
    from ..services.postgres_service import get_executive_insights
    try:
        return get_executive_insights()
    except Exception as exc:
        from fastapi import HTTPException
        raise HTTPException(status_code=500, detail=str(exc))