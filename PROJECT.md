# PROJECT.md — AssetMind

> Written for a competent engineer or AI agent who has never seen this repo.
> This is the onboarding brief a senior engineer would give a new hire on day one.

## 1. What this is, in plain language

AssetMind is a **demo / hackathon-grade industrial predictive-maintenance platform**, built by two
CS students (Tasneem Banu and KS Bande Nawaz Ahamed) as a portfolio and competition project
("Redrob India.Runs Ideathon"). It is **not a production system** — treat it as a well-produced
proof of concept.

It does three unrelated things and presents them in one UI:

1. **A relational dashboard** over synthetic maintenance data (25 fictional pumps/motors/compressors,
   their work orders, inspections, and incidents) stored in PostgreSQL. This is the part that is
   "real" — it queries an actual database and computes actual aggregates.
2. **A RAG chatbot ("Copilot")** that answers free-text questions by retrieving chunks from 9 OEM
   equipment manuals (PDFs) embedded in ChromaDB, optionally merged with the relational data above,
   and sent to a hosted LLM (Sarvam AI's `sarvam-105b`) for a formatted answer.
3. **Two standalone ML demos** — a RandomForest failure classifier and an XGBoost Remaining-Useful-
   Life regressor — trained on two **public academic datasets** (AI4I 2020, NASA CMAPSS FD001) that
   have **no relationship** to the synthetic equipment in PostgreSQL. You type in raw sensor values
   by hand; the result is not tied to any specific piece of "equipment" in the app.

These three systems are stitched together in the frontend but are architecturally independent
and use none of the same data.

**Audience**: maintenance/reliability engineers is the fictional persona in the UI copy; the real
audience is hackathon judges, internship recruiters, and the students' own portfolio.

## 2. Tech stack and why it was likely chosen

| Layer | Choice | Likely reason |
|---|---|---|
| Frontend framework | React 19 + Vite | Fast dev loop, modern React features, standard for hackathon speed |
| Styling | Tailwind CSS v4 (`@theme` CSS variables) + hand-rolled `.card`/`.btn` utility classes | Fast to build a consistent "SaaS dashboard" look without a component library |
| Charts | Recharts | Easiest React charting library for area charts / KPI trends |
| Routing | react-router-dom v7 | Standard SPA routing |
| HTTP | axios | Convenience wrapper, used uniformly in `services/api.js` |
| Backend framework | FastAPI | Automatic OpenAPI docs (`/docs`), async-friendly, Pydantic validation — good fit for a small demo API built quickly |
| DB access | Raw SQLAlchemy Core (`text()` + `engine.connect()`), **not** the ORM, **no** declarative models | Fast to write ad-hoc SQL against a schema that already existed; no need for migrations in a demo |
| Database | PostgreSQL | Relational data (equipment/work orders/incidents/inspections) with foreign-key-like relationships |
| Vector store | ChromaDB (persistent, local disk) | Zero-ops embedded vector DB, good for a demo that must run entirely locally |
| Embeddings | `sentence-transformers` (`all-MiniLM-L6-v2`) | Free, local, small, fast — no API cost per embedding |
| LLM | Sarvam AI (`sarvam-105b`) via `sarvamai` SDK | Likely chosen for cost/availability/regional reasons (Sarvam is an Indian AI lab) over OpenAI/Anthropic |
| ML | scikit-learn (RandomForestClassifier), XGBoost (XGBRegressor) | Standard, fast-to-train tabular models; good "explainable" story via `feature_importances_` for a demo pitch |
| PDF parsing | `pypdf` | Simple text extraction from the 9 OEM manual PDFs |
| Chunking | `langchain_text_splitters` (`RecursiveCharacterTextSplitter`) | Only LangChain piece used — just for chunking, not agents/chains |

## 3. Architecture — how things actually fit together

This is the **real** wiring, reverse-engineered from imports (the README's diagram and API table
are partly aspirational — see GAPS.md item #2).

```
┌─────────────────────────────────────────────────────────────────────┐
│  FRONTEND  (frontend/)                                               │
│  React 19 + Vite, served on :5173 in dev                             │
│                                                                       │
│  App.jsx routes:                                                     │
│    /            → Landing page (marketing, no data)                 │
│    /login       → Fake client-only login (hardcoded demo/demo)      │
│    /app         → AppLayout (Sidebar + Topbar) wraps:                │
│      /app              → Dashboard.jsx                              │
│      /app/assets       → AssetExplorer.jsx                          │
│      /app/equipment/:id→ EquipmentProfile.jsx (+ ML predict panel)   │
│      /app/timeline     → Timeline.jsx                                │
│      /app/copilot      → Copilot.jsx (chat UI)                      │
│      /app/insights     → Insights.jsx                                │
│                                                                       │
│  All API calls go through frontend/src/services/api.js               │
│  → axios instance hardcoded to http://127.0.0.1:8000                 │
└───────────────────────────────┬───────────────────────────────────────┘
                                 │ REST / JSON, CORS-allowed for :5173/:3000
┌───────────────────────────────▼───────────────────────────────────────┐
│  BACKEND  (backend/app/)  — run as `uvicorn app.main:app` from        │
│                              inside backend/ (imports are `app.*`)    │
│                                                                       │
│  app/main.py — FastAPI app, mounts 5 routers, NO auth middleware:     │
│                                                                       │
│    /equipment/*   (app/routes/equipment.py)                          │
│         → app/db.py (SQLAlchemy engine) → raw SQL against Postgres    │
│           tables: equipment, work_order, incident_report,             │
│           inspection_report                                          │
│                                                                       │
│    /dashboard/*   (app/routes/dashboard.py)                          │
│         → app/services/postgres_service.py → same Postgres tables    │
│                                                                       │
│    /insights/*    (app/routes/insights.py)                           │
│         → same Postgres tables (+ postgres_service for 2 endpoints)  │
│                                                                       │
│    /predict/*     (app/routes/predict.py)                            │
│         → app/services/ml_service.py → loads pickled sklearn/XGBoost │
│           models from backend/models/*.pkl (NOT in git, must train)  │
│           Independent of Postgres entirely.                          │
│                                                                       │
│    /ask/*         (app/routes/rag.py)                                │
│         → ChromaDB (backend/chroma_db/, collection                  │
│           "assetmind_manuals") for manual excerpts                   │
│         → app/services/equipment_parser.py to spot an equipment ID   │
│           in the question, then postgres_service.get_incidents/      │
│           get_inspections/get_work_orders for that ID                │
│         → Sarvam AI chat completion for the final answer             │
└─────────────────────────────────────────────────────────────────────┘

  OFFLINE / ONE-TIME SETUP SCRIPTS (backend/scripts/) — not wired into
  the API, must be run manually before the API is useful:
    train_ai4i.py     → reads data/ai4i/ai4i2020.csv, writes backend/models/ai4i_model.pkl + ai4i_scaler.pkl
    train_cmapss.py   → reads data/cmapss/*.txt, writes backend/models/cmapss_model.pkl + cmapss_scaler.pkl
    ingest_manuals.py → reads backend/manuals/*.pdf, writes backend/chroma_db/ (collection assetmind_manuals)

  NOT WIRED IN / DEAD (see GAPS.md for full list):
    backend/api/*, backend/services/*, backend/db/* — 15 files, ALL 0 bytes
    backend/main.py, graph/build_graph.py, rag/ingestion_pipeline.py — 0 bytes
    backend/app/ingestion/run_cognee_sync.py — imports a module that doesn't exist
```

### Data flow — predictive maintenance (`/predict/*`)

This is **fully disconnected** from the equipment/Postgres side of the app. A user (or the
`EquipmentProfile.jsx` "Predict" panel) submits raw sensor readings; the response has no
`equipment_id` and is not persisted anywhere.

```
User input (5 AI4I features, or 14 CMAPSS sensor values)
        │
        ▼
ml_service.py loads backend/models/*.pkl (lazy, cached in module globals)
        │
        ├─ AI4I → RandomForestClassifier.predict_proba → failure_probability, risk_level, top_features
        └─ CMAPSS → XGBRegressor.predict → RUL (cycles) → health_score, degradation_trend
```

### Data flow — RAG Copilot (`/ask/copilot`)

```
question text
   │
   ├─► equipment_parser.extract_id(question)  — regex guess at an equipment ID
   │        │ if found:
   │        ▼
   │   postgres_service.get_incidents/get_inspections/get_work_orders(equipment_id)
   │        → formatted as "Incidents: {...}\nInspections: {...}..." text block
   │
   ├─► SentenceTransformer.encode(question) → ChromaDB.query(n_results=8)
   │        → OEM manual chunks + {manual, page} metadata
   │
   └─► combined_context = relational_context + manual_context (truncated to 12,000 chars)
            │
            ▼
       Sarvam AI chat completion (system prompt + user prompt)
            │
            ▼
       answer_text parsed with regex/string heuristics for:
         - risk_category (keyword search: "critical"/"high"/"medium"/else "low")
         - root_causes (keyword match against a hardcoded list, or fallback to
           the equipment's own incident failure_modes)
         - recommended_actions (regex-extracted lines under a "### Recommendation" heading)
         - confidence (a hand-tuned formula: 0.50 base + bonuses per source count, capped at 0.95)
```

## 4. Key design decisions (inferred)

- **No ORM models, raw SQL everywhere.** Every route function opens its own
  `engine.connect()` or `SessionLocal()` and writes a `text()` query. This means there is no
  single source of truth for the DB schema in Python — you have to read the SQL strings to know
  what columns exist. Likely a deliberate speed-over-structure tradeoff for a hackathon timeline.
- **Two completely separate "prediction" datasets vs one "operations" dataset.** The team
  clearly wanted an impressive ML story (96%+ accuracy, ROC-AUC 0.97) and used public,
  well-labeled datasets (AI4I, CMAPSS) to get there quickly, rather than engineering a predictive
  model on their own synthetic 25-asset data (which has no real machine-failure signal — it's
  hand-authored, not sampled from a real degradation process).
- **RAG kept intentionally narrow.** Manual retrieval + Postgres retrieval are combined only
  for the `/ask/copilot` endpoint, not the simpler `/ask/` endpoint, presumably added later as a
  "v2" capability layered on top without changing the original.
- **Confidence and risk-category scores in the Copilot response are heuristics, not model
  outputs.** They are computed after the LLM call by counting sources and scanning the LLM's own
  text for keywords like "critical" / "urgent". This is fragile but cheap, and clearly a "make the
  demo look quantified" decision.
- **Fake login.** `Login.jsx` hardcodes `demo@assetmind.com` / `demo` and does client-side
  routing only — there is no backend session, token, or protected route. This is a demo
  convenience, not a real auth gate (see GAPS.md — the backend has zero auth of any kind).

## 5. Critical paths — what matters, what's load-bearing, what's safe to touch

**Load-bearing (touch carefully, most of the app's value lives here):**
- `backend/app/db.py` — the one place the DB connection string lives. Everything downstream
  depends on `engine`/`SessionLocal` from here.
- `backend/app/services/postgres_service.py` — nearly every dashboard/insights number the UI
  shows comes from this one file's raw SQL. A change to a formula here (e.g. `_risk_level`
  thresholds, the risk_score weighting `0.4/0.4/0.2`) changes numbers across Dashboard,
  AssetExplorer, EquipmentProfile, and Insights simultaneously.
- `backend/app/services/ml_service.py` + `backend/models/*.pkl` — the entire `/predict` feature.
  The `.pkl` files are gitignored; if they're missing, `/predict/*` returns 503, not a crash — this
  is handled reasonably well.
- `backend/app/routes/rag.py` module-level code (ChromaDB client, `get_collection(...)`,
  SarvamAI client) — runs at **import time**. If `backend/chroma_db/` doesn't exist yet or
  `SARVAM_API_KEY` is missing, the **entire FastAPI app** can fail to start, not just the `/ask`
  routes (see GAPS.md).
- `frontend/src/services/api.js` — every network call in the frontend goes through this one file.
  It's the natural place to add auth headers, retries, or a real base-URL config later.
- `frontend/src/styles/global.css` — the entire visual design system (`--color-*` variables,
  `.card`/`.btn` classes) is defined here and consumed by nearly every component via Tailwind's
  `[var(--color-x)]` arbitrary-value syntax.

**Safe to change casually:**
- Any individual page's JSX layout/copy in `frontend/src/pages/Landing/*` (pure marketing content,
  no data dependencies).
- `README.md` (already drifted from reality — see GAPS.md — so it carries little risk either way).
- Cosmetic constants (icons, `EXAMPLE_QUESTIONS` in Copilot.jsx, skeleton loader shapes).
- The dead files in `backend/api/`, `backend/services/`, `backend/db/`, `backend/main.py`,
  `graph/`, `rag/` — they are empty and unimported; deleting them changes nothing at runtime.

## 6. Surprising / non-obvious things that will trip up a newcomer

1. **There is no `requirements.txt` anywhere in the repo**, despite the README instructing
   `pip install -r requirements.txt`. You must infer the Python dependency list from imports
   (see CLAUDE.md for the reconstructed list).
2. **There is no database seed script, no Alembic, no SQL schema file, and no ORM model
   classes**, despite the README instructing `python scripts/seed_data.py` and
   `alembic upgrade head`. The PostgreSQL schema (`equipment`, `work_order`, `incident_report`,
   `inspection_report` tables) must be created and populated by hand from the CSVs in `data/`
   before the backend is useful. The column names needed can be reverse-engineered from the SQL
   in `app/services/postgres_service.py` and `app/routes/equipment.py`, and roughly match the
   CSV headers in `data/*.csv` (note: CSV file names are plural — `work_orders.csv`,
   `incident_reports.csv`, `inspection_reports.csv` — but the SQL tables are singular —
   `work_order`, `incident_report`, `inspection_report`).
3. **The README's "API Reference" table is aspirational, not real.** It documents endpoints
   like `/api/assets`, `/api/query`, `/api/dashboard/kpis` with an `/api` prefix. The actual
   mounted routers have **no `/api` prefix at all** and different names entirely: `/equipment`,
   `/dashboard`, `/insights`, `/predict`, `/ask`. Always check `app/main.py` and the individual
   route files, never the README, for the real API surface.
4. **`backend/scripts/ingest_manuals.py` must be run with its working directory set to
   `backend/scripts/`** (it uses relative paths `../manuals`, `../chroma_db`), while
   `train_ai4i.py`/`train_cmapss.py` resolve paths from `__file__` and can be run from
   anywhere. Same folder, two different conventions.
5. **The ML "Predict" feature on the Equipment Profile page has nothing to do with that
   specific equipment.** It's a generic calculator against two public datasets (AI4I, NASA
   CMAPSS) with default sensor values baked into the frontend. Don't expect predictions to
   reflect an asset's actual maintenance history.
6. **The RUL health-score math looks miscalibrated** — see GAPS.md item — training clips RUL at
   130 cycles but the serving code assumes a 0–400 cycle range, which skews `degradation_trend`
   toward "Critical"/"Declining" almost always.
7. **Two parallel, unused backend module trees exist** (`backend/api/`, `backend/services/`,
   `backend/db/` vs. the real `backend/app/...`), and every file in the unused tree is completely
   empty (0 bytes). It looks like a restructuring was started (moving from a flat structure to
   the `app/` package) and the old files were emptied but never deleted.
8. **The RAG route file (`app/routes/rag.py`) instantiates network/disk clients at import
   time** — `SentenceTransformer(...)`, `chromadb.PersistentClient(...).get_collection(...)`,
   and `SarvamAI(...)`. Any of these failing (missing ChromaDB collection, missing API key)
   can prevent the whole FastAPI app from starting, since `app/main.py` imports this module
   unconditionally at startup.
