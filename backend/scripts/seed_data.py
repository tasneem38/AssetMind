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
