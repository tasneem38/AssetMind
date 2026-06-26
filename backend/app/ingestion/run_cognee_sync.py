import asyncio
import os
import sys
from dotenv import load_dotenv

load_dotenv()

# Ensure backend directory is in path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from sqlalchemy import text
from app.db import engine
# pyrefly: ignore [missing-import]
import cognee
from app.schemas.graph_schemas import EquipmentNode, IncidentNode, WorkOrderNode, InspectionNode

async def sync_data():
    print("Fetching data from PostgreSQL...")
    nodes = []

    with engine.connect() as conn:
        # 1. Fetch Equipment
        equipment_rows = conn.execute(text("SELECT * FROM equipment")).fetchall()
        for row in equipment_rows:
            mapping = dict(row._mapping)
            nodes.append(EquipmentNode(
                id=mapping.get("equipment_id"),
                criticality=mapping.get("criticality")
            ))

        # 2. Fetch Incidents
        incident_rows = conn.execute(text("SELECT * FROM incident_report")).fetchall()
        for i, row in enumerate(incident_rows):
            mapping = dict(row._mapping)
            nodes.append(IncidentNode(
                id=f"INC-{mapping.get('equipment_id')}-{i}",
                failure_mode=mapping.get("failure_mode"),
                date=str(mapping.get("incident_date")),
                equipment_id=mapping.get("equipment_id")
            ))

        # 3. Fetch Work Orders
        wo_rows = conn.execute(text("SELECT * FROM work_order")).fetchall()
        for i, row in enumerate(wo_rows):
            mapping = dict(row._mapping)
            nodes.append(WorkOrderNode(
                id=f"WO-{mapping.get('equipment_id')}-{i}",
                problem=mapping.get("problem"),
                action_taken=mapping.get("action_taken"),
                date=str(mapping.get("work_order_date")),
                equipment_id=mapping.get("equipment_id")
            ))

        # 4. Fetch Inspections
        insp_rows = conn.execute(text("SELECT * FROM inspection_report")).fetchall()
        for i, row in enumerate(insp_rows):
            mapping = dict(row._mapping)
            nodes.append(InspectionNode(
                id=f"INSP-{mapping.get('equipment_id')}-{i}",
                finding=mapping.get("finding"),
                recommendation=mapping.get("recommendation"),
                follow_up_required=mapping.get("follow_up_required"),
                date=str(mapping.get("inspection_date")),
                equipment_id=mapping.get("equipment_id")
            ))

    print(f"Extracted {len(nodes)} nodes. Pushing to Cognee...")
    
    # Add data to cognee dataset
    await cognee.add(nodes, "assetmind_dataset")
    
    print("Cognifying dataset...")
    await cognee.cognify()
    
    print("Cognee sync complete!")

if __name__ == "__main__":
    asyncio.run(sync_data())
