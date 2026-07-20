import os
import sys
import pandas as pd
from sqlalchemy import text

# Allow importing from backend/app
_SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
_BACKEND_DIR = os.path.dirname(_SCRIPT_DIR)
sys.path.append(_BACKEND_DIR)

from app.db import engine

def seed():
    with engine.connect() as conn:
        with conn.begin():
            conn.execute(text('''
                CREATE TABLE IF NOT EXISTS equipment (
                    equipment_id TEXT PRIMARY KEY,
                    equipment_name TEXT,
                    equipment_type TEXT,
                    location TEXT,
                    manufacturer TEXT,
                    criticality TEXT,
                    install_date TEXT
                )
            '''))
            conn.execute(text('''
                CREATE TABLE IF NOT EXISTS work_order (
                    work_order_id TEXT PRIMARY KEY,
                    equipment_id TEXT,
                    work_order_date TEXT,
                    problem TEXT,
                    root_cause TEXT,
                    action_taken TEXT,
                    technician TEXT,
                    status TEXT
                )
            '''))
            conn.execute(text('''
                CREATE TABLE IF NOT EXISTS incident_report (
                    incident_id TEXT PRIMARY KEY,
                    equipment_id TEXT,
                    incident_date TEXT,
                    failure_mode TEXT,
                    root_cause TEXT,
                    contributing_factors TEXT,
                    corrective_action TEXT,
                    preventable TEXT,
                    linked_work_order TEXT
                )
            '''))
            conn.execute(text('''
                CREATE TABLE IF NOT EXISTS inspection_report (
                    inspection_id TEXT PRIMARY KEY,
                    equipment_id TEXT,
                    inspection_date TEXT,
                    inspector TEXT,
                    vibration_reading REAL,
                    temperature_reading REAL,
                    risk_score INTEGER,
                    finding TEXT,
                    recommendation TEXT,
                    follow_up_required TEXT
                )
            '''))
            
            conn.execute(text("""
                DROP VIEW IF EXISTS equipment_risk_scores
            """))
            conn.execute(text("""
                CREATE VIEW equipment_risk_scores AS
                SELECT
                    e.equipment_id,
                    COALESCE(inc.incident_count, 0)   AS incident_count,
                    COALESCE(ins.avg_risk, 0)          AS avg_inspection_risk,
                    COALESCE(fu.followup_count, 0)     AS open_followups,
                    LEAST(
                        COALESCE(inc.incident_count, 0) * 0.4 +
                        COALESCE(ins.avg_risk, 0)          * 0.4 +
                        COALESCE(fu.followup_count, 0)     * 0.2,
                        100.0
                    ) AS risk_score
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
            """))

            # Indexes to avoid full table scans on every per-asset query
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_workorder_eid
                ON work_order(equipment_id)
            """))
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_incident_eid
                ON incident_report(equipment_id)
            """))
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_inspection_eid
                ON inspection_report(equipment_id)
            """))

            conn.execute(text("TRUNCATE TABLE equipment, work_order, incident_report, inspection_report CASCADE"))
    
    data_dir = os.path.join(os.path.dirname(_BACKEND_DIR), "data")
    
    eq_df = pd.read_csv(os.path.join(data_dir, "equipment.csv"))
    eq_df.to_sql("equipment", con=engine, if_exists="append", index=False)
    
    wo_df = pd.read_csv(os.path.join(data_dir, "work_orders.csv"))
    wo_df.rename(columns={"date": "work_order_date", "wo_id": "work_order_id"}, inplace=True)
    wo_df.to_sql("work_order", con=engine, if_exists="append", index=False)
    
    inc_df = pd.read_csv(os.path.join(data_dir, "incident_reports.csv"))
    inc_df.to_sql("incident_report", con=engine, if_exists="append", index=False)
    
    insp_df = pd.read_csv(os.path.join(data_dir, "inspection_reports.csv"))
    insp_df.to_sql("inspection_report", con=engine, if_exists="append", index=False)
    
    print("Database seeded successfully.")

if __name__ == "__main__":
    seed()
