from fastapi import APIRouter
from pydantic import BaseModel
import os
import sys
# Bypass Windows AppLocker blocking the grpc cygrpc.pyd extension on Windows only
if sys.platform == "win32":
    from unittest.mock import MagicMock
    grpc_mock = MagicMock()
    grpc_mock.__version__ = '1.60.0'
    sys.modules['grpc'] = grpc_mock

import chromadb
from sentence_transformers import SentenceTransformer
from sarvamai import SarvamAI
from typing import Optional, List, Dict, Any
from dotenv import load_dotenv

load_dotenv()

from ..config import *  # map SARVAM_API_KEY to GEMINI_API_KEY

import logging
logger = logging.getLogger(__name__)

sarvam_api_key = os.getenv("SARVAM_API_KEY")
if sarvam_api_key:
    sarvam_client = SarvamAI(api_subscription_key=sarvam_api_key)
else:
    logger.warning("SARVAM_API_KEY not set. RAG endpoints will fail.")
    sarvam_client = None

router = APIRouter(
    prefix="/ask",
    tags=["RAG"]
)

BASE_DIR = os.path.dirname(
    os.path.dirname(
        os.path.dirname(os.path.abspath(__file__))
    )
)

client = chromadb.PersistentClient(
    path=os.path.join(BASE_DIR, "chroma_db")
)

collection = client.get_or_create_collection(
    "assetmind_manuals"
)

model = SentenceTransformer(
    "all-MiniLM-L6-v2"
)

# New imports for relational data handling
from ..services.equipment_parser import extract_id
from ..services import postgres_service


class QuestionRequest(BaseModel):
    question: str
    context: Optional[str] = None
    sources: Optional[List[Dict[str, Any]]] = None

SYSTEM_PROMPT = """You are AssetMind Copilot, an AI assistant for industrial maintenance and reliability engineering.

Your job is to help maintenance engineers, reliability engineers, and plant managers make better operational decisions.

You have access to:

1. Equipment history
2. Work orders
3. Inspection reports
4. Incident reports
5. OEM manuals
6. Standard operating procedures
7. Failure risk scores
8. Asset health scores

When answering:

* Prioritize operational evidence.
* Use inspection history.
* Use incident history.
* Use maintenance history.
* Use OEM manual recommendations.
* Use SOP recommendations.
* Explain reasoning clearly.

Always provide:

1. Likely cause
2. Supporting evidence
3. Risk assessment
4. Recommended action

If evidence is weak:

* State uncertainty clearly.
* Explain what additional information is required.

Never invent incidents, inspections, work orders, or manual references.

Use a professional industrial engineering tone.

Response Format:

### Summary

Short explanation.

### Evidence

Bullet list.

### Risk Assessment

Low / Medium / High / Critical

### Recommendation

Specific maintenance actions.

### Sources

List all reports and manuals used.

After the markdown response, append exactly one JSON block (no extra text) with this structure:
```json
{"root_causes": ["cause1", "cause2"], "risk_category": "Low|Medium|High|Critical"}
```
"""

@router.post("/")
def ask_assetmind(request: QuestionRequest):
    if not sarvam_client:
        from fastapi import HTTPException
        raise HTTPException(status_code=503, detail="Sarvam API client not initialized.")

    query_embedding = model.encode(
        request.question
    ).tolist()

    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=5
    )

    sources = []
    context = ""

    for doc, meta in zip(
        results["documents"][0],
        results["metadatas"][0]
    ):

        context += doc + "\n\n"

        sources.append({
            "manual": meta["manual"],
            "page": meta["page"]
        })

    prompt = f"""
You are an industrial maintenance expert.

Answer the user's question using ONLY the provided manual excerpts.

Question:
{request.question}

Manual Context:
{context[:4000]}

Provide:

### Summary

### Likely Causes

### Operational Risk

### Recommended Actions

### Sources
"""

    # Use Sarvam chat completion for the simple ask endpoint
    response = sarvam_client.chat.completions(
        model="sarvam-105b",
        messages=[{"role": "user", "content": prompt}]
    )
    answer_text = response.choices[0].message.content

    return {
        "question": request.question,
        "answer": answer_text,
        "sources": sources
    }

@router.post("/copilot")
def ask_copilot(request: QuestionRequest):
    if not sarvam_client:
        from fastapi import HTTPException
        raise HTTPException(status_code=503, detail="Sarvam API client not initialized.")

    equipment_id = extract_id(
        request.question
    )

    relational_sources = []
    relational_context = ""

    if equipment_id:

        incidents = postgres_service.get_incidents(
            equipment_id
        )

        inspections = postgres_service.get_inspections(
            equipment_id
        )

        work_orders = postgres_service.get_work_orders(
            equipment_id
        )

        def format_records(name, records):

            lines = []

            for rec in records:

                rec_dict = dict(rec)

                lines.append(
                    f"{name}: {rec_dict}"
                )

            return "\n".join(lines)

        relational_context = "\n\n".join([
            format_records("Incidents", incidents),
            format_records("Inspections", inspections),
            format_records("Work Orders", work_orders)
        ])

        for inc in incidents:

            relational_sources.append({
                "type": "incident",
                "data": dict(inc)
            })

        for ins in inspections:

            relational_sources.append({
                "type": "inspection",
                "data": dict(ins)
            })

        for wo in work_orders:

            relational_sources.append({
                "type": "work_order",
                "data": dict(wo)
            })

    query_embedding = model.encode(
        request.question
    ).tolist()

    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=8
    )

    manual_context = ""
    manual_sources = []

    for doc, meta in zip(
        results["documents"][0],
        results["metadatas"][0]
    ):

        manual_context += (
            f"Manual: {meta['manual']} "
            f"(Page {meta['page']})\n"
            f"{doc}\n\n"
        )

        manual_sources.append({
            "manual": meta["manual"],
            "page": meta["page"]
        })

    combined_context = f"""
RELATIONAL DATA

{relational_context}

OEM MANUAL EVIDENCE

{manual_context}
"""

    user_prompt = f"""
Question:

{request.question}

Context:

{combined_context[:12000]}
"""

    # Use Sarvam chat completion for the copilot endpoint
    response = sarvam_client.chat.completions(
        model="sarvam-105b",
        messages=[{"role": "system", "content": SYSTEM_PROMPT}, {"role": "user", "content": user_prompt}]
    )
    # Guard against None — Sarvam occasionally returns an empty content field
    answer_text = (response.choices[0].message.content or "").strip()

    if not answer_text:
        answer_text = (
            "### Summary\n"
            "The AI model returned an empty response. "
            "This may be a transient API issue — please retry your question.\n\n"
            "### Recommendation\n"
            "Retry the query. If the problem persists, check the SARVAM_API_KEY "
            "environment variable and your API quota."
        )

    # ── Heuristic confidence score ────────────────────────────────────────────
    # confidence = min(0.95, 0.50
    #     + 0.05 * incident_count
    #     + 0.03 * inspection_count
    #     + 0.02 * manual_citation_count)
    incident_count_for_conf = len([
        s for s in relational_sources if s["type"] == "incident"
    ])
    inspection_count_for_conf = len([
        s for s in relational_sources if s["type"] == "inspection"
    ])
    manual_citation_count = len(manual_sources)

    confidence = round(
        min(
            0.95,
            0.50
            + 0.05 * incident_count_for_conf
            + 0.03 * inspection_count_for_conf
            + 0.02 * manual_citation_count,
        ),
        2,
    )

    # ── Strip the JSON metadata block from the answer text ────────────────────
    import re, json
    json_block_match = re.search(
        r"```json\s*(\{.*?\})\s*```",
        answer_text,
        re.DOTALL,
    )
    root_causes: list = []
    risk_category = "Low"

    if json_block_match:
        try:
            meta = json.loads(json_block_match.group(1))
            root_causes = meta.get("root_causes", [])
            risk_category = meta.get("risk_category", "Low")
        except json.JSONDecodeError:
            pass
        # Remove the JSON block from the displayed answer
        answer_text = answer_text[: json_block_match.start()].strip()

    # Fallback: keyword-scan answer prose if JSON block missing
    if not root_causes:
        answer_lower = answer_text.lower()
        KNOWN_ROOT_CAUSES = [
            "Bearing Wear", "Bearing Failure", "Cavitation", "Corrosion",
            "Overheating", "Seal Leakage", "Vibration", "Misalignment",
            "Fouling", "Lubrication Failure", "Overload", "Insulation Failure",
            "Pitting", "Gasket Failure",
        ]
        root_causes = [c for c in KNOWN_ROOT_CAUSES if c.lower() in answer_lower]
        # Last resort: pull from incident failure_mode
        if not root_causes and relational_sources:
            seen: set = set()
            for src in relational_sources:
                if src["type"] == "incident":
                    fm = src["data"].get("failure_mode")
                    if fm and fm not in seen:
                        root_causes.append(fm)
                        seen.add(fm)
                        if len(root_causes) >= 3:
                            break

    # Fallback risk category from prose if JSON block missing
    if risk_category == "Low" and json_block_match is None:
        answer_lower = answer_text.lower()
        if "critical" in answer_lower or "immediate" in answer_lower:
            risk_category = "Critical"
        elif "high" in answer_lower or "urgent" in answer_lower:
            risk_category = "High"
        elif "medium" in answer_lower or "moderate" in answer_lower:
            risk_category = "Medium"

    # ── Extract recommended actions (lines after ### Recommendation) ──────────
    recommended_actions: list = []
    if "### recommendation" in answer_lower or "### recommended" in answer_lower:
        import re
        rec_match = re.search(
            r"###\s*Recom[a-z ]*\n(.*?)(?=###|\Z)",
            answer_text,
            re.IGNORECASE | re.DOTALL,
        )
        if rec_match:
            raw_rec = rec_match.group(1).strip()
            lines = [
                l.lstrip("•-*123456789. ").strip()
                for l in raw_rec.splitlines()
                if l.strip() and not l.strip().startswith("#")
            ]
            recommended_actions = [l for l in lines if len(l) > 5][:5]

    return {
        "question": request.question,
        "equipment_id": equipment_id,
        "answer": answer_text,
        # ── Enhanced fields ──
        "confidence": confidence,
        "risk_category": risk_category,
        "root_causes": root_causes,
        "recommended_actions": recommended_actions,
        # ── Sources ──
        "sources": {
            "manuals": manual_sources,
            "relational": relational_sources,
        },
    }