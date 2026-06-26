from fastapi import APIRouter, HTTPException
from sqlalchemy import text

from app.db import engine
from app.services import postgres_service

router = APIRouter(
    prefix="/equipment",
    tags=["Equipment"]
)

@router.get("/")
def get_equipment():

    with engine.connect() as conn:

        result = conn.execute(
            text(
                """
                SELECT *
                FROM equipment
                """
            )
        )

        rows = result.fetchall()

        return [
            dict(row._mapping)
            for row in rows
        ]

@router.get("/{equipment_id}/briefing")
def get_equipment_briefing(equipment_id: str):

    with engine.connect() as conn:

        equipment = conn.execute(
            text("""
                SELECT
                    equipment_id,
                    criticality
                FROM equipment
                WHERE equipment_id = :id
            """),
            {"id": equipment_id}
        ).fetchone()

        work_orders = conn.execute(
            text("""
                SELECT COUNT(*)
                FROM work_order
                WHERE equipment_id = :id
            """),
            {"id": equipment_id}
        ).scalar()

        incidents = conn.execute(
            text("""
                SELECT COUNT(*)
                FROM incident_report
                WHERE equipment_id = :id
            """),
            {"id": equipment_id}
        ).scalar()

        last_inspection = conn.execute(
            text("""
                SELECT inspection_date
                FROM inspection_report
                WHERE equipment_id = :id
                ORDER BY inspection_date DESC
                LIMIT 1
            """),
            {"id": equipment_id}
        ).scalar()

        followups = conn.execute(
            text("""
                SELECT COUNT(*)
                FROM inspection_report
                WHERE equipment_id = :id
                AND follow_up_required = 'Yes'
            """),
            {"id": equipment_id}
        ).scalar()

        common_failure = conn.execute(
            text("""
                SELECT failure_mode
                FROM incident_report
                WHERE equipment_id = :id
                GROUP BY failure_mode
                ORDER BY COUNT(*) DESC
                LIMIT 1
            """),
            {"id": equipment_id}
        ).scalar()

        equipment_data = dict(equipment._mapping)

        return {
            "equipment_id": equipment_data["equipment_id"],
            "criticality": equipment_data["criticality"],
            "total_work_orders": work_orders,
            "total_incidents": incidents,
            "last_inspection": last_inspection,
            "open_followups": followups,
            "common_failure": common_failure
        }

@router.get("/{equipment_id}/timeline")
def get_timeline(equipment_id: str):

    with engine.connect() as conn:

        timeline = []

        inspections = conn.execute(
            text("""
                SELECT
                    inspection_date,
                    finding,
                    recommendation
                FROM inspection_report
                WHERE equipment_id = :id
            """),
            {"id": equipment_id}
        ).fetchall()

        for row in inspections:

            timeline.append({
                "date": row.inspection_date,
                "event_type": "Inspection",
                "description": row.finding
            })

            timeline.append({
                "date": row.inspection_date,
                "event_type": "Recommendation",
                "description": row.recommendation
            })

        work_orders = conn.execute(
            text("""
                SELECT
                    work_order_date,
                    problem,
                    action_taken
                FROM work_order
                WHERE equipment_id = :id
            """),
            {"id": equipment_id}
        ).fetchall()

        for row in work_orders:

            timeline.append({
                "date": row.work_order_date,
                "event_type": "Work Order",
                "description": row.problem
            })

            timeline.append({
                "date": row.work_order_date,
                "event_type": "Repair",
                "description": row.action_taken
            })

        incidents = conn.execute(
            text("""
                SELECT
                    incident_date,
                    failure_mode
                FROM incident_report
                WHERE equipment_id = :id
            """),
            {"id": equipment_id}
        ).fetchall()

        for row in incidents:

            timeline.append({
                "date": row.incident_date,
                "event_type": "Incident",
                "description": row.failure_mode
            })

        timeline.sort(
            key=lambda x: x["date"]
        )

        return timeline

@router.get("/{equipment_id}/incidents")
def get_incidents(
    equipment_id: str
):

    with engine.connect() as conn:

        result = conn.execute(
            text(
                """
                SELECT *
                FROM incident_report
                WHERE equipment_id = :id
                ORDER BY incident_date DESC
                """
            ),
            {"id": equipment_id}
        )

        rows = result.fetchall()

        return [
            dict(row._mapping)
            for row in rows
        ]
    
@router.get("/{equipment_id}/inspections")
def get_inspections(
    equipment_id: str
):

    with engine.connect() as conn:

        result = conn.execute(
            text(
                """
                SELECT *
                FROM inspection_report
                WHERE equipment_id = :id
                ORDER BY inspection_date DESC
                """
            ),
            {"id": equipment_id}
        )

        rows = result.fetchall()

        return [
            dict(row._mapping)
            for row in rows
        ]

@router.get("/{equipment_id}")
def get_equipment_by_id(
    equipment_id: str
):

    with engine.connect() as conn:

        result = conn.execute(
            text(
                """
                SELECT *
                FROM equipment
                WHERE equipment_id = :id
                """
            ),
            {"id": equipment_id}
        )

        row = result.fetchone()

        if not row:
            return {
                "error": "Equipment not found"
            }

        return dict(row._mapping)


@router.get("/{equipment_id}/health")
def get_equipment_health(equipment_id: str):
    """
    Compute a penalty-based health score for the given equipment.

    health_score = 100
        - min(incident_count * 5, 40)           # incident_penalty  (max 40)
        - min((avg_risk_score / 100) * 30, 30)  # risk_penalty       (max 30)
        - min(open_followups * 3, 30)            # followup_penalty   (max 30)

    Status:
        >= 80  → Healthy
        >= 50  → At Risk
        <  50  → Critical
    """
    try:
        return postgres_service.get_health_score(equipment_id)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))