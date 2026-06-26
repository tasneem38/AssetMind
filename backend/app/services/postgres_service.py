from sqlalchemy import text
from ..db import SessionLocal, engine


# ─────────────────────────────────────────
# Existing helpers (unchanged)
# ─────────────────────────────────────────

def get_incidents(equipment_id, limit=5):

    with SessionLocal() as db:

        result = db.execute(
        text("""
        SELECT *
        FROM incident_report
        WHERE equipment_id = :eid
        ORDER BY incident_date DESC
        LIMIT :limit
        """),
        {
            "eid": equipment_id,
            "limit": limit
        }
    )

    return result.mappings().all()

def get_inspections(equipment_id, limit=5):

    with SessionLocal() as db:

        result = db.execute(
        text("""
        SELECT *
        FROM inspection_report
        WHERE equipment_id = :eid
        ORDER BY inspection_date DESC
        LIMIT :limit
        """),
        {
            "eid": equipment_id,
            "limit": limit
        }
    )

    return result.mappings().all()

def get_work_orders(equipment_id, limit=5):

    with SessionLocal() as db:

        result = db.execute(
            text("""
            SELECT *
            FROM work_order
            WHERE equipment_id = :eid
            ORDER BY work_order_date DESC
            LIMIT :limit
            """),
            {
                "eid": equipment_id,
                "limit": limit
            }
        )

        return result.mappings().all()


# ─────────────────────────────────────────
# Task 1 – Dashboard aggregate stats
# ─────────────────────────────────────────

def get_dashboard_stats() -> dict:
    """Return top-level aggregate counts for the dashboard."""
    with engine.connect() as conn:

        total_assets = conn.execute(
            text("SELECT COUNT(*) FROM equipment")
        ).scalar() or 0

        total_work_orders = conn.execute(
            text("SELECT COUNT(*) FROM work_order")
        ).scalar() or 0

        total_incidents = conn.execute(
            text("SELECT COUNT(*) FROM incident_report")
        ).scalar() or 0

        total_inspections = conn.execute(
            text("SELECT COUNT(*) FROM inspection_report")
        ).scalar() or 0

        # Knowledge gaps: inspections with follow_up=Yes, risk_score>=75,
        # and the equipment has at least one incident
        knowledge_gaps = conn.execute(
            text("""
                SELECT COUNT(DISTINCT ir.inspection_id)
                FROM inspection_report ir
                WHERE ir.follow_up_required = 'Yes'
                  AND ir.risk_score >= 75
                  AND EXISTS (
                      SELECT 1 FROM incident_report inc
                      WHERE inc.equipment_id = ir.equipment_id
                  )
            """)
        ).scalar() or 0

        # Preventable failures: incidents marked preventable (Yes or Partially)
        preventable_failures = conn.execute(
            text("""
                SELECT COUNT(*)
                FROM incident_report
                WHERE preventable IN ('Yes', 'Partially')
            """)
        ).scalar() or 0

        # Top failure mode by count
        top_failure_mode = conn.execute(
            text("""
                SELECT failure_mode
                FROM incident_report
                GROUP BY failure_mode
                ORDER BY COUNT(*) DESC
                LIMIT 1
            """)
        ).scalar() or "Unknown"

        # High-risk assets: equipment with computed risk_score >= 70
        # (same formula as the /high-risk-assets endpoint)
        high_risk_assets = conn.execute(
            text("""
                SELECT COUNT(*) FROM (
                    SELECT
                        e.equipment_id,
                        (
                            COALESCE(inc.incident_count, 0) * 0.4 +
                            COALESCE(ins.avg_risk, 0) * 0.4 +
                            COALESCE(fu.followup_count, 0) * 0.2
                        ) AS raw_score
                    FROM equipment e
                    LEFT JOIN (
                        SELECT equipment_id, COUNT(*) AS incident_count
                        FROM incident_report
                        GROUP BY equipment_id
                    ) inc ON e.equipment_id = inc.equipment_id
                    LEFT JOIN (
                        SELECT equipment_id, AVG(risk_score) AS avg_risk
                        FROM inspection_report
                        GROUP BY equipment_id
                    ) ins ON e.equipment_id = ins.equipment_id
                    LEFT JOIN (
                        SELECT equipment_id, COUNT(*) AS followup_count
                        FROM inspection_report
                        WHERE follow_up_required = 'Yes'
                        GROUP BY equipment_id
                    ) fu ON e.equipment_id = fu.equipment_id
                ) sub
                WHERE raw_score >= 70
            """)
        ).scalar() or 0

    return {
        "total_assets": int(total_assets),
        "total_work_orders": int(total_work_orders),
        "total_incidents": int(total_incidents),
        "total_inspections": int(total_inspections),
        "high_risk_assets": int(high_risk_assets),
        "knowledge_gaps": int(knowledge_gaps),
        "preventable_failures": int(preventable_failures),
        "top_failure_mode": top_failure_mode,
    }


# ─────────────────────────────────────────
# Task 2 – High risk asset ranking
# ─────────────────────────────────────────

def _risk_level(score: float) -> str:
    if score >= 90:
        return "Critical"
    elif score >= 70:
        return "High"
    elif score >= 40:
        return "Medium"
    return "Low"


def get_all_equipment_risk_scores() -> list:
    """
    risk_score = incident_count*0.4 + avg_inspection_risk*0.4 + open_followups*0.2
    Normalised to 0–100, sorted descending.
    """
    with engine.connect() as conn:
        rows = conn.execute(
            text("""
                SELECT
                    e.equipment_id,
                    COALESCE(inc.incident_count, 0)        AS incident_count,
                    COALESCE(ins.avg_risk, 0)               AS avg_inspection_risk,
                    COALESCE(fu.followup_count, 0)          AS open_followups
                FROM equipment e
                LEFT JOIN (
                    SELECT equipment_id, COUNT(*) AS incident_count
                    FROM incident_report
                    GROUP BY equipment_id
                ) inc ON e.equipment_id = inc.equipment_id
                LEFT JOIN (
                    SELECT equipment_id, AVG(risk_score) AS avg_risk
                    FROM inspection_report
                    GROUP BY equipment_id
                ) ins ON e.equipment_id = ins.equipment_id
                LEFT JOIN (
                    SELECT equipment_id, COUNT(*) AS followup_count
                    FROM inspection_report
                    WHERE follow_up_required = 'Yes'
                    GROUP BY equipment_id
                ) fu ON e.equipment_id = fu.equipment_id
                ORDER BY e.equipment_id
            """)
        ).fetchall()

    results = []
    for row in rows:
        raw = (
            float(row.incident_count) * 0.4 +
            float(row.avg_inspection_risk) * 0.4 +
            float(row.open_followups) * 0.2
        )
        # Cap at 100
        score = round(min(raw, 100.0), 1)
        results.append({
            "equipment_id": row.equipment_id,
            "risk_score": score,
            "risk_level": _risk_level(score),
        })

    results.sort(key=lambda x: x["risk_score"], reverse=True)
    return results


# ─────────────────────────────────────────
# Task 4 – Equipment Health Score
# ─────────────────────────────────────────

def get_health_score(equipment_id: str) -> dict:
    """
    health_score = 100
        - min(incident_count * 5, 40)           # max 40
        - min((avg_risk_score / 100) * 30, 30)  # max 30
        - min(open_followups * 3, 30)            # max 30
    """
    with engine.connect() as conn:

        incident_count = conn.execute(
            text("""
                SELECT COUNT(*) FROM incident_report
                WHERE equipment_id = :eid
            """),
            {"eid": equipment_id}
        ).scalar() or 0

        avg_risk = conn.execute(
            text("""
                SELECT COALESCE(AVG(risk_score), 0)
                FROM inspection_report
                WHERE equipment_id = :eid
            """),
            {"eid": equipment_id}
        ).scalar() or 0

        open_followups = conn.execute(
            text("""
                SELECT COUNT(*) FROM inspection_report
                WHERE equipment_id = :eid
                  AND follow_up_required = 'Yes'
            """),
            {"eid": equipment_id}
        ).scalar() or 0

    incident_penalty = min(int(incident_count) * 5, 40)
    risk_penalty = min((float(avg_risk) / 100.0) * 30, 30)
    followup_penalty = min(int(open_followups) * 3, 30)

    health_score = round(100 - incident_penalty - risk_penalty - followup_penalty)
    health_score = max(0, health_score)

    if health_score >= 80:
        status = "Healthy"
    elif health_score >= 50:
        status = "At Risk"
    else:
        status = "Critical"

    return {
        "equipment_id": equipment_id,
        "health_score": health_score,
        "status": status,
    }


# ─────────────────────────────────────────
# Task 6 – Knowledge Gap Summary
# ─────────────────────────────────────────

def get_knowledge_gap_summary() -> dict:
    """Summarise knowledge gaps: reuses same gap logic as /insights/knowledge-gaps."""
    with engine.connect() as conn:

        total_incidents = conn.execute(
            text("SELECT COUNT(*) FROM incident_report")
        ).scalar() or 0

        # Count distinct gap inspections
        gap_count = conn.execute(
            text("""
                SELECT COUNT(DISTINCT ir.inspection_id)
                FROM inspection_report ir
                WHERE ir.follow_up_required = 'Yes'
                  AND ir.risk_score >= 75
                  AND EXISTS (
                      SELECT 1 FROM incident_report inc
                      WHERE inc.equipment_id = ir.equipment_id
                  )
            """)
        ).scalar() or 0

        # Top assets that appear in gap inspections, ranked by gap-inspection count
        top_assets_rows = conn.execute(
            text("""
                SELECT ir.equipment_id, COUNT(*) AS gap_count
                FROM inspection_report ir
                WHERE ir.follow_up_required = 'Yes'
                  AND ir.risk_score >= 75
                  AND EXISTS (
                      SELECT 1 FROM incident_report inc
                      WHERE inc.equipment_id = ir.equipment_id
                  )
                GROUP BY ir.equipment_id
                ORDER BY gap_count DESC
                LIMIT 5
            """)
        ).fetchall()

    preventable_failure_rate = round(
        (gap_count / total_incidents) * 100, 2
    ) if total_incidents else 0

    top_assets = [row.equipment_id for row in top_assets_rows]

    return {
        "total_gaps": int(gap_count),
        "preventable_failure_rate": preventable_failure_rate,
        "top_assets": top_assets,
    }


# ─────────────────────────────────────────
# Task 7 – Executive Insights
# ─────────────────────────────────────────

def get_executive_insights() -> dict:
    """Generate high-level executive insights from real PostgreSQL data."""
    with engine.connect() as conn:

        # ── Highest risk asset ──────────────────────────────────────────
        risk_rows = conn.execute(
            text("""
                SELECT
                    e.equipment_id,
                    (
                        COALESCE(inc.incident_count, 0) * 0.4 +
                        COALESCE(ins.avg_risk, 0) * 0.4 +
                        COALESCE(fu.followup_count, 0) * 0.2
                    ) AS raw_score
                FROM equipment e
                LEFT JOIN (
                    SELECT equipment_id, COUNT(*) AS incident_count
                    FROM incident_report GROUP BY equipment_id
                ) inc ON e.equipment_id = inc.equipment_id
                LEFT JOIN (
                    SELECT equipment_id, AVG(risk_score) AS avg_risk
                    FROM inspection_report GROUP BY equipment_id
                ) ins ON e.equipment_id = ins.equipment_id
                LEFT JOIN (
                    SELECT equipment_id, COUNT(*) AS followup_count
                    FROM inspection_report
                    WHERE follow_up_required = 'Yes'
                    GROUP BY equipment_id
                ) fu ON e.equipment_id = fu.equipment_id
                ORDER BY raw_score DESC
                LIMIT 1
            """)
        ).fetchone()

        highest_risk_asset = risk_rows.equipment_id if risk_rows else "Unknown"
        avg_raw_score = float(risk_rows.raw_score) if risk_rows else 0.0

        # ── Average risk score across all assets ───────────────────────
        all_scores = conn.execute(
            text("""
                SELECT
                    COALESCE(inc.incident_count, 0) * 0.4 +
                    COALESCE(ins.avg_risk, 0) * 0.4 +
                    COALESCE(fu.followup_count, 0) * 0.2 AS raw_score
                FROM equipment e
                LEFT JOIN (
                    SELECT equipment_id, COUNT(*) AS incident_count
                    FROM incident_report GROUP BY equipment_id
                ) inc ON e.equipment_id = inc.equipment_id
                LEFT JOIN (
                    SELECT equipment_id, AVG(risk_score) AS avg_risk
                    FROM inspection_report GROUP BY equipment_id
                ) ins ON e.equipment_id = ins.equipment_id
                LEFT JOIN (
                    SELECT equipment_id, COUNT(*) AS followup_count
                    FROM inspection_report
                    WHERE follow_up_required = 'Yes'
                    GROUP BY equipment_id
                ) fu ON e.equipment_id = fu.equipment_id
            """)
        ).fetchall()

        scores = [min(float(r.raw_score), 100.0) for r in all_scores]
        avg_risk_score = round(sum(scores) / len(scores), 1) if scores else 0.0

        # ── Most common failure mode ────────────────────────────────────
        most_common_failure = conn.execute(
            text("""
                SELECT failure_mode
                FROM incident_report
                GROUP BY failure_mode
                ORDER BY COUNT(*) DESC
                LIMIT 1
            """)
        ).scalar() or "Unknown"

        # ── Preventable failure count ───────────────────────────────────
        preventable_failures = conn.execute(
            text("""
                SELECT COUNT(*)
                FROM incident_report
                WHERE preventable IN ('Yes', 'Partially')
            """)
        ).scalar() or 0

        # ── Recommended action based on highest risk asset type ─────────
        equipment_type = conn.execute(
            text("""
                SELECT equipment_type
                FROM equipment
                WHERE equipment_id = :eid
            """),
            {"eid": highest_risk_asset}
        ).scalar() or "equipment"

    type_actions = {
        "Pump": (
            "Focus predictive maintenance on pumps with recurring cavitation "
            "and bearing wear. Schedule immediate bearing inspection for highest-risk units."
        ),
        "Motor": (
            "Prioritise motor alignment checks and vibration analysis. "
            "Inspect insulation on motors with thermal cycling history."
        ),
        "Compressor": (
            "Inspect intercooler fouling and oil separator elements. "
            "Schedule preventive oil changes and valve assembly replacement."
        ),
        "Heat Exchanger": (
            "Accelerate corrosion monitoring and tube bundle inspections. "
            "Review water treatment program to reduce fouling rate."
        ),
        "Valve": (
            "Audit packing condition across high-cycle valves. "
            "Replace worn stem packing and inspect seats under planned shutdown."
        ),
    }
    recommended_action = type_actions.get(
        equipment_type,
        f"Prioritise maintenance planning for {highest_risk_asset} and assets with open follow-ups."
    )

    return {
        "highest_risk_asset": highest_risk_asset,
        "most_common_failure_mode": most_common_failure,
        "preventable_failures": int(preventable_failures),
        "avg_risk_score": avg_risk_score,
        "recommended_action": recommended_action,
    }
