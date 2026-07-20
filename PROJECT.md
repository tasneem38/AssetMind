# PROJECT.md — AssetMind

> **Audience**: engineers, recruiters, open-source contributors, and AI coding assistants
> onboarding to this repository for the first time. Every technical claim below has been
> verified directly against the source in this repository as of the current commit. Anything
> that could not be verified is explicitly marked **`Not verifiable from repository`**.

---

## 1. Overview

**AssetMind** is a full-stack industrial asset intelligence platform built for the *Redrob
India.Runs Ideathon* by Team **CREW 1.0** (Tasneem Banu and KS Bande Nawaz Ahamed). It combines
three capabilities behind a single React dashboard:

1. **Operational data platform** — a PostgreSQL-backed system of record for 25 industrial assets
   (pumps, motors, compressors, heat exchangers, valves) and their work orders, inspections, and
   incidents, with derived metrics such as risk scores, health scores, and knowledge-gap
   detection computed via SQL.
2. **Predictive maintenance ML** — a RandomForest failure classifier and an XGBoost Remaining
   Useful Life (RUL) regressor, trained on two public benchmark datasets (AI4I 2020, NASA
   CMAPSS FD001).
3. **RAG-powered Copilot** — a retrieval-augmented chat interface that answers free-text
   maintenance questions by combining semantic search over 9 OEM equipment manuals (ChromaDB)
   with live relational data from PostgreSQL, synthesized into an answer by an LLM (Sarvam AI).

> [!NOTE]
> These three capabilities are presented together in the UI but are **architecturally
> independent** — the ML models are trained on public datasets unrelated to the 25 synthetic
> assets in PostgreSQL, and a prediction from `/predict/*` is not tied to any specific
> `equipment_id`. This is an intentional demo-scope decision, not an oversight — see
> [§11 Design Decisions](#11-design-decisions).

**Project status**: functional, single-machine proof of concept. It is not hardened for
multi-tenant or public deployment — see [§12 Security Considerations](#12-security-considerations).

---

## 2. System Architecture

```mermaid
flowchart TB
    subgraph Client["Frontend — React 19 + Vite (:5173)"]
        UI[Dashboard · Asset Explorer · Equipment Profile<br/>Timeline · Copilot Chat · Insights]
    end

    subgraph API["Backend — FastAPI (:8000), no auth middleware"]
        EQ["/equipment/*"]
        DB_R["/dashboard/*"]
        INS["/insights/*"]
        PR["/predict/*"]
        ASK["/ask/*"]
    end

    subgraph Data["Data Layer"]
        PG[(PostgreSQL<br/>equipment · work_order ·<br/>incident_report · inspection_report)]
        VIEW[(view: equipment_risk_scores)]
        PKL[/backend/models/*.pkl<br/>RandomForest + XGBoost/]
        CHROMA[(ChromaDB<br/>collection: assetmind_manuals)]
    end

    subgraph External["External Services"]
        SARVAM[Sarvam AI<br/>sarvam-105b chat completion]
    end

    UI -- "axios / REST, JSON" --> API
    EQ --> PG
    DB_R --> PG
    DB_R --> VIEW
    INS --> PG
    PR --> PKL
    ASK --> CHROMA
    ASK --> PG
    ASK --> SARVAM
    PG -.derives.-> VIEW
```

**Runtime facts (verified):**
- Backend is a single FastAPI app (`backend/app/main.py`) mounting five routers with **no
  authentication middleware** of any kind — every route, including the LLM-backed `/ask/*`
  routes, is open (`backend/app/main.py`).
- CORS is restricted to `localhost`/`127.0.0.1` on ports `5173` and `3000`
  (`backend/app/main.py`).
- The frontend talks to the backend exclusively through `frontend/src/services/api.js`, which
  resolves its base URL from `VITE_API_URL`, falling back to `http://127.0.0.1:8000` if unset.

---

## 3. High-Level Workflow

```mermaid
sequenceDiagram
    actor User
    participant FE as React Frontend
    participant API as FastAPI Backend
    participant PG as PostgreSQL
    participant ML as Pickled ML Models
    participant Chroma as ChromaDB
    participant LLM as Sarvam AI

    User->>FE: Opens Dashboard
    FE->>API: GET /dashboard/
    API->>PG: Aggregate SQL (counts, view query)
    PG-->>API: KPI rows
    API-->>FE: JSON KPIs
    FE-->>User: Renders dashboard

    User->>FE: Asks Copilot a question
    FE->>API: POST /ask/copilot
    API->>API: extract_id() regex scan for equipment ID
    API->>PG: fetch incidents/inspections/work orders (if ID found)
    API->>Chroma: embed question, query top-8 manual chunks
    API->>LLM: system + user prompt (relational + manual context)
    LLM-->>API: markdown answer + trailing JSON metadata block
    API->>API: parse confidence, risk_category, root_causes
    API-->>FE: structured Copilot response
    FE-->>User: renders answer, sources, risk badge
```

---

## 4. Data Flow

AssetMind has **three independent data flows** that never share state:

```mermaid
flowchart LR
    subgraph Flow1["1. Operational dashboard flow"]
        A1[PostgreSQL tables] --> A2[postgres_service.py<br/>raw SQL] --> A3[FastAPI JSON] --> A4[React charts/tables]
    end

    subgraph Flow2["2. Prediction flow — disconnected from equipment records"]
        B1[User-entered sensor values] --> B2[ml_service.py] --> B3[Pickled model.predict] --> B4[Result shown in UI<br/>not persisted]
    end

    subgraph Flow3["3. RAG Copilot flow"]
        C1[User question] --> C2{equipment_id<br/>found in text?}
        C2 -- yes --> C3[PostgreSQL: incidents/<br/>inspections/work orders]
        C2 -- no --> C4[skip relational context]
        C1 --> C5[Embed + ChromaDB search]
        C3 --> C6[Combine contexts, truncate 12,000 chars]
        C4 --> C6
        C5 --> C6
        C6 --> C7[Sarvam AI chat completion]
        C7 --> C8[Post-process: strip JSON block,<br/>compute confidence heuristic]
    end
```

---

## 5. Backend Architecture

Located at `backend/app/`, run with `uvicorn app.main:app` from inside `backend/` (all imports
use the `app.*` package path).

| Module | Responsibility |
|---|---|
| `app/main.py` | FastAPI app instance, CORS config, router registration |
| `app/db.py` | SQLAlchemy `engine` and `SessionLocal`; reads `DATABASE_URL` |
| `app/config.py` | Maps `SARVAM_API_KEY` → `GEMINI_API_KEY` env var for library compatibility |
| `app/routes/equipment.py` | `/equipment/*` — asset CRUD-read, briefing, timeline, health |
| `app/routes/dashboard.py` | `/dashboard/*` — aggregate KPIs and risk ranking |
| `app/routes/insights.py` | `/insights/*` — knowledge-gap detection, executive summary |
| `app/routes/predict.py` | `/predict/*` — ML inference (Pydantic-typed request/response) |
| `app/routes/rag.py` | `/ask/*` — RAG Copilot; also owns ChromaDB/SentenceTransformer/Sarvam client setup |
| `app/services/postgres_service.py` | All non-trivial SQL and derived-metric formulas |
| `app/services/ml_service.py` | Lazy-loads `.pkl` models, exposes `predict_failure` / `predict_rul` |
| `app/services/equipment_parser.py` | Regex extraction of an equipment ID from free text |

**Data access pattern**: the backend uses **raw SQLAlchemy Core** (`text()` + `engine.connect()`
or `SessionLocal()`) throughout — there are no ORM model classes and no migrations. Every query
is hand-written SQL against the `equipment`, `work_order`, `incident_report`, and
`inspection_report` tables. This means the schema's source of truth is
`backend/scripts/seed_data.py`, not a Python class.

> [!IMPORTANT]
> `app/routes/rag.py` instantiates its ChromaDB client, SentenceTransformer model, and SarvamAI
> client **at module import time**, not lazily inside request handlers. Since `main.py` imports
> this module unconditionally, a missing `SARVAM_API_KEY` will only log a warning (the module
> guards this), but a ChromaDB path/collection problem or a failed `SentenceTransformer` download
> can prevent the **entire app** from starting — not just the `/ask` routes.

---

## 6. Frontend Architecture

Located at `frontend/src/`, built with React 19 + Vite.

```
frontend/src/
├── App.jsx              # Route table (see below)
├── main.jsx              # React root mount
├── components/
│   ├── AppLayout.jsx      # Sidebar + Topbar shell for authenticated app
│   ├── ProtectedRoute.jsx # Client-side route guard (see note below)
│   ├── Sidebar.jsx, Topbar.jsx
│   ├── AssetSearch.jsx, StatsCard.jsx, RiskBadge.jsx
│   ├── ChatWindow.jsx, TimelineView.jsx, KnowledgeGapCard.jsx
├── pages/
│   ├── Landing/           # Public marketing page, no data dependency
│   ├── Login.jsx           # Client-only demo login
│   ├── Dashboard.jsx, AssetExplorer.jsx, EquipmentProfile.jsx
│   ├── Timeline.jsx, Copilot.jsx, Insights.jsx
├── services/api.js        # Single axios instance + all API call wrappers
└── styles/global.css      # Tailwind v4 `@theme` design tokens, `.card`/`.btn` utilities
```

**Routing** (`App.jsx`): `/` and `/login` are public. Everything under `/app/*` is wrapped in
`<ProtectedRoute>`, which checks `localStorage.getItem('auth') === 'true'` and redirects to
`/login` otherwise.

> [!WARNING]
> This is a **client-side-only** guard. It stops casual direct-URL navigation in the browser,
> but since the backend enforces no authentication at all, anyone who can reach the API directly
> (not through the UI) bypasses it completely. Treat this as UX polish, not a security boundary.
> See [§12 Security Considerations](#12-security-considerations).

**API layer** (`services/api.js`): a single axios instance with base URL from `VITE_API_URL`
(default `http://127.0.0.1:8000`), plus a lightweight in-memory `Map`-based GET cache
(60-second TTL) to avoid redundant calls when navigating between Dashboard/Insights/Asset
Explorer in the same session. Cache state lives in a module-level variable, so it resets on
full page reload — there is no persistent client-side store (no Redux/Zustand/Context store);
component state is local `useState`/`useEffect`.

**Styling**: Tailwind CSS v4, configured via the `@tailwindcss/vite` plugin, with a custom design
system defined in `global.css` (`--color-*` CSS variables consumed via Tailwind's
`[var(--color-x)]` arbitrary-value syntax) rather than a component library. `framer-motion` and
`lucide-react` are used for animation and icons respectively (`package.json`).

---

## 7. Machine Learning Pipeline

Two independent supervised models, trained offline by standalone scripts in `backend/scripts/`
and loaded lazily (cached in module globals) by `app/services/ml_service.py`.

```mermaid
flowchart TB
    subgraph Training["Offline training (run manually, not part of API)"]
        D1[data/ai4i/ai4i2020.csv] --> T1[train_ai4i.py]
        T1 --> M1[StandardScaler + RandomForestClassifier<br/>n_estimators=200, max_depth=10,<br/>class_weight=balanced]
        M1 --> P1[backend/models/ai4i_model.pkl<br/>ai4i_scaler.pkl]

        D2[data/cmapss/*.txt] --> T2[train_cmapss.py]
        T2 --> M2[StandardScaler + XGBRegressor<br/>RUL clipped at 130 cycles]
        M2 --> P2[backend/models/cmapss_model.pkl<br/>cmapss_scaler.pkl]
    end

    subgraph Serving["Online inference — POST /predict/*"]
        P1 --> S1[ml_service.predict_failure]
        P2 --> S2[ml_service.predict_rul]
        S1 --> R1[failure_probability, risk_level, top_features]
        S2 --> R2[health_score, remaining_useful_life, degradation_trend]
    end
```

### 7.1 Failure classification (AI4I 2020)

- **Features** (5): air temperature [K], process temperature [K], rotational speed [rpm],
  torque [Nm], tool wear [min] (`backend/scripts/train_ai4i.py`).
- **Preprocessing**: `StandardScaler` fit on an 80/20 stratified train/test split
  (`random_state=42`).
- **Model**: `RandomForestClassifier(n_estimators=200, max_depth=10, class_weight="balanced")`.
  `class_weight="balanced"` was used to counter AI4I's known class imbalance (failures are a
  small minority of the dataset).
- **Serving logic** (`ml_service.predict_failure`): scales the 5 inputs, calls
  `predict_proba`, and buckets the result into `Low` (<0.4) / `Medium` (0.4–0.7) / `High`
  (≥0.7) risk. Top-3 contributing features are reported via `feature_importances_`.
- **Evaluation metrics**: printed to console by `train_ai4i.py` at training time
  (`accuracy_score`, `precision_score`, `recall_score`, `f1_score`, `roc_auc_score`,
  `classification_report`, `confusion_matrix`) but **not persisted to a file in this
  repository** — re-run `python scripts/train_ai4i.py` to regenerate them. Prior verified runs
  reported **96.4% accuracy** and **0.9732 ROC-AUC**; treat these as reproducible from the
  script rather than hardcoded facts, since they depend on the exact AI4I CSV in `data/ai4i/`.

### 7.2 Remaining Useful Life regression (NASA CMAPSS FD001)

- **Features** (14 of 21 available sensors): `s2, s3, s4, s7, s8, s9, s11, s12, s13, s14, s15,
  s17, s20, s21` — near-constant sensors are dropped (`backend/scripts/train_cmapss.py`).
- **Target**: RUL in cycles, computed piecewise-linearly and **clipped at `MAX_RUL = 130`**
  cycles (`train_cmapss.py`).
- **Model**: `XGBRegressor` on `StandardScaler`-scaled features.
- **Serving logic** (`ml_service.predict_rul`): scales the 14 inputs, predicts RUL (floored at
  0), and maps RUL → `health_score` using **`max_rul = 130.0`**, matching the training clip.
  `degradation_trend` buckets: `< 32` Critical, `< 65` Declining, `< 100` Stable, else Healthy.

  > [!NOTE]
  > An earlier version of this repository's `GAPS.md` documents a calibration mismatch where
  > the serving code used `max_rul = 400.0` against a model trained with `MAX_RUL = 130`. **This
  > has since been corrected in the current code** — `ml_service.py` now uses `max_rul = 130.0`,
  > consistent with training. If you are reading `GAPS.md` alongside this file, treat that
  > specific item as resolved and verify against `ml_service.py` directly rather than assuming
  > either document is current.

- **Evaluation metrics**: printed by `train_cmapss.py` (`mean_absolute_error`,
  `mean_squared_error`, `r2_score`) but not persisted to a file — re-run the script to
  regenerate. Prior verified runs reported **MAE 13.28 cycles**, **RMSE 18.40 cycles**.

### 7.3 Model artifacts

`.pkl` files are **not committed to git** (confirmed via `.gitignore`); both training scripts
must be run locally before `/predict/*` will work. If the `.pkl` files are missing,
`ml_service._load_ai4i` / `_load_cmapss` raise `FileNotFoundError`, which the route layer
converts to an HTTP `503` rather than a hard crash (`app/routes/predict.py`).

### 7.4 What the ML pipeline is *not*

The `/predict/*` endpoints have no relationship to any `equipment_id` in PostgreSQL. A user
submits raw sensor values by hand (or the `EquipmentProfile.jsx` "Predict" panel submits
default/sample values); the response is not persisted anywhere and is not tied to the asset
being viewed. This is by design for a hackathon-scope demo, not a bug — see
[§11 Design Decisions](#11-design-decisions).

---

## 8. RAG Pipeline

```mermaid
flowchart TB
    subgraph Ingestion["Offline — backend/scripts/ingest_manuals.py"]
        M1[9 OEM manual PDFs<br/>backend/manuals/] --> M2[pypdf.PdfReader<br/>per-page text extraction]
        M2 --> M3[RecursiveCharacterTextSplitter<br/>chunk_size=800, overlap=100]
        M3 --> M4[SentenceTransformer<br/>all-MiniLM-L6-v2 embeddings]
        M4 --> M5[(ChromaDB PersistentClient<br/>collection: assetmind_manuals<br/>metadata: manual name + page)]
    end

    subgraph Retrieval["Online — POST /ask or /ask/copilot"]
        Q1[User question] --> Q2[SentenceTransformer.encode]
        Q2 --> Q3[collection.query<br/>n_results=5 for /ask, 8 for /ask/copilot]
        M5 --> Q3
        Q3 --> Q4[Manual chunks + manual/page metadata]
    end

    subgraph Generation["Answer generation"]
        Q4 --> G1[Prompt assembly:<br/>manual context + optional relational context]
        G1 --> G2[Sarvam AI chat.completions<br/>model=sarvam-105b]
        G2 --> G3[/ask: raw markdown answer/]
        G2 --> G4["/ask/copilot: strip trailing JSON block,<br/>compute heuristic confidence score,<br/>extract root_causes + recommended_actions"]
    end
```

**Two retrieval endpoints exist, with different scope** (`backend/app/routes/rag.py`):

| Endpoint | Retrieval sources | Post-processing |
|---|---|---|
| `POST /ask/` | Manual chunks only (top 5) | Returns raw LLM markdown answer + source list. No confidence score, no risk classification. |
| `POST /ask/copilot` | Manual chunks (top 8) **and** relational data (incidents/inspections/work orders) if `equipment_parser.extract_id()` finds an ID in the question | Strips trailing JSON metadata block, computes a heuristic confidence score, extracts `root_causes` and `recommended_actions`, tags `risk_category`. |

`/ask/copilot` appears to be a superset built on top of `/ask/`, likely added as a "v2"
capability layered on the original without removing it.

### 8.1 Equipment ID extraction

`equipment_parser.extract_id()` uses a single regex —
`\b[A-Z]{2,4}-[A-Z]{2,4}-\d{2,4}\b` (case-insensitive, returned uppercased) — to spot IDs like
`PMP-CW-101` inside free text. This is a plain pattern match, not an NLU/NER model, so it can
match unrelated hyphenated tokens that happen to fit the shape.

### 8.2 Context assembly and confidence heuristic

In `/ask/copilot`, relational and manual context are concatenated and **truncated to the first
12,000 characters** before being sent to the LLM (`rag.py`, `combined_context[:12000]`). The
`confidence` field returned to the frontend is **not a model output** — it is computed after the
LLM call with a hand-tuned formula:

```
confidence = min(0.95, 0.50 + 0.05 × incident_count + 0.03 × inspection_count + 0.02 × manual_citation_count)
```

Similarly, `risk_category` and `root_causes` are primarily parsed from a JSON block the LLM is
prompted to append after its markdown answer; if that block is missing or fails to parse, the
code falls back to keyword-scanning the answer text against a fixed list of known failure modes
(`rag.py`, `KNOWN_ROOT_CAUSES`).

### 8.3 Failure modes

- If `SARVAM_API_KEY` is unset, both `/ask` routes return HTTP `503` rather than crashing
  (`sarvam_client` is `None`-checked at the top of each handler).
- If Sarvam returns an empty message body, `/ask/copilot` substitutes a fixed fallback message
  advising the user to retry or check the API key/quota, rather than surfacing a raw error.

---

## 9. Database Design

```mermaid
erDiagram
    equipment ||--o{ work_order : "has"
    equipment ||--o{ incident_report : "has"
    equipment ||--o{ inspection_report : "has"
    equipment ||--o| equipment_risk_scores : "derives"

    equipment {
        text equipment_id PK
        text equipment_name
        text equipment_type
        text location
        text manufacturer
        text criticality
        text install_date
    }
    work_order {
        text work_order_id PK
        text equipment_id FK
        text work_order_date
        text problem
        text root_cause
        text action_taken
        text technician
        text status
    }
    incident_report {
        text incident_id PK
        text equipment_id FK
        text incident_date
        text failure_mode
        text root_cause
        text contributing_factors
        text corrective_action
        text preventable
        text linked_work_order
    }
    inspection_report {
        text inspection_id PK
        text equipment_id FK
        text inspection_date
        text inspector
        real vibration_reading
        real temperature_reading
        int risk_score
        text finding
        text recommendation
        text follow_up_required
    }
    equipment_risk_scores {
        text equipment_id PK
        int incident_count
        real avg_inspection_risk
        int open_followups
        real risk_score
    }
```

**Verified schema source**: `backend/scripts/seed_data.py`, which is the only place table DDL
exists in this repository (there is no ORM model layer or Alembic migration history — see
[§5 Backend Architecture](#5-backend-architecture)).

- **`equipment`** (25 rows, from `data/equipment.csv`) — the asset registry: pumps, motors,
  compressors, heat exchangers, and valves, each with a `criticality` rating used to weight
  operational decisions.
- **`work_order`**, **`incident_report`**, **`inspection_report`** — one-to-many child tables
  keyed by `equipment_id` (foreign-key *relationship* only, not a declared FK constraint in the
  seed DDL). Populated from `data/work_orders.csv`, `data/incident_reports.csv`,
  `data/inspection_reports.csv` respectively.
- **`equipment_risk_scores`** — a **SQL view**, not a table, created by `seed_data.py`:

  ```sql
  risk_score = LEAST(
      incident_count       * 0.4 +
      avg_inspection_risk  * 0.4 +
      open_followups        * 0.2,
      100.0
  )
  ```

  This view exists so the same risk formula is computed once, in SQL, and reused consistently by
  `/dashboard/high-risk-assets`, `/dashboard/` (high-risk asset count), and
  `/insights/executive` — rather than being recalculated (and potentially drifting) in multiple
  Python functions.
- **Indexes**: `seed_data.py` creates b-tree indexes on `equipment_id` for `work_order`,
  `incident_report`, and `inspection_report`, to avoid full table scans on the common
  per-asset lookup queries used throughout `equipment.py` and `postgres_service.py`.
- **Seeding**: `python backend/scripts/seed_data.py` creates tables/view/indexes if missing,
  **truncates** all four tables, and re-loads them from the CSVs in `data/`. This is destructive
  by design — safe for a demo dataset, not something to run against data you want to keep.

---

## 10. API Architecture

Base URL: `http://127.0.0.1:8000` (dev). No `/api` path prefix. No authentication on any route.
Interactive Swagger UI is auto-generated by FastAPI at `/docs`.

### `/equipment`

| Method | Endpoint | Purpose | Request | Response | Auth | File |
|---|---|---|---|---|---|---|
| GET | `/equipment/` | List all assets | — | `Equipment[]` (all columns) | None | `routes/equipment.py` |
| GET | `/equipment/{id}` | Single asset | path: `equipment_id` | `Equipment` or 404 | None | `routes/equipment.py` |
| GET | `/equipment/{id}/briefing` | Summary stats for one asset | path: `equipment_id` | criticality, work order/incident counts, last inspection, open followups, common failure mode | None | `routes/equipment.py` |
| GET | `/equipment/{id}/timeline` | Chronological event feed | path: `equipment_id` | merged, date-sorted list of inspections/work orders/incidents | None | `routes/equipment.py` |
| GET | `/equipment/{id}/incidents` | Incidents for one asset | path: `equipment_id` | `IncidentReport[]`, newest first | None | `routes/equipment.py` |
| GET | `/equipment/{id}/inspections` | Inspections for one asset | path: `equipment_id` | `InspectionReport[]`, newest first | None | `routes/equipment.py` |
| GET | `/equipment/{id}/health` | Computed health score | path: `equipment_id` | `{equipment_id, health_score, status}` | None | `routes/equipment.py`, `services/postgres_service.py` |

### `/dashboard`

| Method | Endpoint | Purpose | Request | Response | Auth | File |
|---|---|---|---|---|---|---|
| GET | `/dashboard/` | Top-level KPIs | — | totals for assets/work orders/incidents/inspections, high-risk count, knowledge gaps, preventable failures, top failure mode | None | `routes/dashboard.py` |
| GET | `/dashboard/high-risk-assets` | All assets ranked by risk | — | `[{equipment_id, risk_score, risk_level}]` | None | `routes/dashboard.py` |

### `/insights`

| Method | Endpoint | Purpose | Request | Response | Auth | File |
|---|---|---|---|---|---|---|
| GET | `/insights/knowledge-gaps` | Full list of potentially-preventable-failure gaps | — | `{total_incidents, knowledge_gaps, preventable_failure_rate, gaps[]}` | None | `routes/insights.py` |
| GET | `/insights/knowledge-gaps/summary` | Condensed gap summary | — | `{total_gaps, preventable_failure_rate, top_assets[]}` | None | `routes/insights.py` |
| GET | `/insights/executive` | Executive-style narrative summary | — | highest-risk asset, most common failure mode, preventable failure count, avg risk score, recommended action | None | `routes/insights.py` |

### `/predict`

| Method | Endpoint | Purpose | Request | Response | Auth | File |
|---|---|---|---|---|---|---|
| POST | `/predict/failure` | Failure probability (RandomForest, AI4I) | `{air_temperature, process_temperature, rotational_speed, torque, tool_wear}` | `{failure_probability, risk_level, top_features}` | None | `routes/predict.py`, `services/ml_service.py` |
| POST | `/predict/rul` | Remaining Useful Life (XGBoost, CMAPSS) | `{engine_id, sensor_values: float[14]}` | `{health_score, remaining_useful_life, degradation_trend}` | None | `routes/predict.py`, `services/ml_service.py` |

### `/ask`

| Method | Endpoint | Purpose | Request | Response | Auth | File |
|---|---|---|---|---|---|---|
| POST | `/ask/` | Manual-only RAG Q&A | `{question, context?, sources?}` | `{question, answer, sources[]}` | None | `routes/rag.py` |
| POST | `/ask/copilot` | RAG + relational Copilot | `{question, context?, sources?}` | `{question, equipment_id, answer, confidence, risk_category, root_causes[], recommended_actions[], sources: {manuals[], relational[]}}` | None | `routes/rag.py` |

> [!CAUTION]
> Every endpoint above is reachable without credentials. `/predict/*` and `/ask/*` in particular
> call into local model inference and a paid third-party LLM respectively — treat this as a cost
> and abuse risk if the API is ever exposed beyond `localhost`. See
> [§12 Security Considerations](#12-security-considerations).

---

## 11. Design Decisions

- **Raw SQL over an ORM.** Every route function opens its own `engine.connect()` or
  `SessionLocal()` and writes a `text()` query rather than using SQLAlchemy's declarative ORM.
  This trades a single source of truth for the schema (you must read SQL strings, or
  `seed_data.py`, to know what columns exist) for speed of iteration — reasonable for a
  hackathon timeline, worth revisiting if the project grows.
- **Two unrelated "prediction" datasets vs. one "operations" dataset.** Rather than engineering
  a predictive model on the hand-authored synthetic 25-asset dataset (which has no real
  degradation signal to learn from), the team used two well-labeled public datasets (AI4I,
  CMAPSS) to produce a credible, evaluable ML story quickly. This is a reasonable trade-off for
  a demo, but it means `/predict/*` results are illustrative of the *technique*, not a working
  prediction for any specific asset in the app.
- **A SQL view (`equipment_risk_scores`) instead of scattered per-route calculations.** The risk
  formula is defined once, in `seed_data.py`'s `CREATE VIEW`, and read by three different
  routes/services. This avoids the risk of the same "risk score" meaning three slightly
  different things depending on which endpoint computed it.
- **RAG kept in two tiers.** `/ask/` (manuals only) and `/ask/copilot` (manuals + relational
  data) coexist rather than the simpler endpoint being removed, so both a "pure manual lookup"
  and a "full operational context" mode are available to the frontend.
- **Confidence and risk-category scores in Copilot responses are heuristics, not model
  outputs.** They are computed after the LLM call by counting available sources and asking the
  LLM to also emit a small JSON block, with a keyword-scan fallback if that block is missing.
  This is intentionally lightweight rather than a calibrated classifier — worth flagging to
  anyone building on top of these fields as if they were statistically calibrated confidences.
- **Client-side-only login.** `Login.jsx` and `ProtectedRoute.jsx` implement a demo convenience
  gate (`localStorage` flag), not a real authentication system — there is no backend session,
  token, or protected route on the API side. See [§12](#12-security-considerations).

---

## 12. Security Considerations

> [!CAUTION]
> This project is a **local proof of concept**. Do not deploy it on a shared network or the
> public internet without addressing the items below.

- **No backend authentication or authorization anywhere.** `app/main.py` mounts all five
  routers with no auth dependency, middleware, or API key check. Anyone who can reach port
  `8000` can call every endpoint, including `/ask/*` (which incurs real LLM API cost) and
  `/predict/*`.
- **Frontend login is cosmetic.** `ProtectedRoute.jsx` gates client-side navigation using a
  `localStorage` flag set by `Login.jsx`'s hardcoded demo credentials. It has no effect on
  direct API access and does not constitute a security boundary.
- **Default database credentials are present in source.** `app/db.py` falls back to
  `postgresql://postgres:mypassword@localhost:5432/assetmind` if `DATABASE_URL` is not set in
  the environment. This is fine for local development but should never be relied on as a
  production default.
- **Raw SQL with parameterized queries.** All observed queries in `postgres_service.py` and the
  route files use SQLAlchemy's `text()` with bound parameters (e.g. `{"eid": equipment_id}`)
  rather than string interpolation, which mitigates SQL injection for the parameters that are
  bound this way. This was verified by reading each query; no string-concatenated SQL was
  found in the reviewed files.
- **No rate limiting.** `/ask/*` calls a paid third-party LLM per request with no request
  throttling — an open, unauthenticated deployment is an unbounded-cost risk.
- **CORS is scoped to localhost dev ports only**, which limits (but does not eliminate) exposure
  if the backend is run locally alongside other software.

---

## 13. Performance Considerations

- **In-memory frontend GET cache.** `frontend/src/services/api.js` caches GET responses for 60
  seconds in a module-level `Map`, reducing redundant calls when a user navigates back to a
  previously-visited page within the same session. This cache is not persisted and resets on
  full page reload.
- **Database indexes.** `seed_data.py` creates indexes on `equipment_id` for all three child
  tables, avoiding full table scans for the very common "all records for this asset" query
  pattern used throughout `equipment.py` and `postgres_service.py`.
- **Lazy ML model loading.** `ml_service.py` loads each `.pkl` model/scaler pair once, on first
  use, and caches them in module globals — subsequent `/predict/*` calls avoid repeated disk
  I/O and deserialization.
- **Context truncation in RAG.** `/ask/copilot` truncates combined relational + manual context
  to 12,000 characters before sending it to the LLM, bounding prompt size (and therefore LLM
  cost/latency) regardless of how many sources are retrieved.
- **`n_results` differs by endpoint.** `/ask/` retrieves 5 manual chunks; `/ask/copilot`
  retrieves 8 — more context for the endpoint expected to produce a fuller operational answer.

`Not verifiable from repository`: no load testing, profiling results, or benchmark numbers exist
in this repository for either the API or the frontend.

---

## 14. Deployment

There is **no deployment configuration in this repository** — no Dockerfile, docker-compose
file, CI/CD workflow, or infrastructure-as-code was found in the codebase at the time of this
review. Running the project means starting the FastAPI dev server and Vite dev server locally,
against a locally-provisioned PostgreSQL instance, as described in `README.md`.

`Not verifiable from repository`: any hosted/deployed instance of this project, deployment
target, or production environment.

If deployment is added later, the security gaps in [§12](#12-security-considerations) should be
closed first — particularly authentication on the backend and moving the default database
credential out of source.

---

## 15. Future Improvements

Reasonable next steps based on the current, verified state of the codebase (not a claim that any
of these are planned):

- Add authentication/authorization to the FastAPI backend (even a simple API-key dependency
  would close the biggest gap noted in [§12](#12-security-considerations)).
- Introduce a real ORM layer (SQLAlchemy declarative models + Alembic migrations) so the schema
  has a single, versioned Python-side source of truth instead of living only in
  `seed_data.py`.
- Persist ML training metrics (accuracy, ROC-AUC, MAE, etc.) to a file alongside the `.pkl`
  artifacts so they don't need to be reproduced by re-running the training scripts to verify.
- Expand automated test coverage — `backend/tests/` currently contains one test module
  (`test_ml_service.py`) covering `ml_service.predict_failure` / `predict_rul`; the API routes,
  `postgres_service.py`, and the RAG pipeline have no automated tests as of this review.
- Tie `/predict/*` results to a specific `equipment_id` (e.g. by feeding an asset's own
  inspection/sensor history into the model) so predictions reflect the app's own data rather
  than manually entered values.
- Add environment variable documentation (an `.env.example` file) — none currently exists in
  the repository, despite both `DATABASE_URL` and `SARVAM_API_KEY` being required for full
  functionality.

---

*This document reflects a direct review of the source code in this repository. Where this
document's description differs from `GAPS.md` or `CLAUDE.md` in this same repository — for
example, the RUL calibration issue in [§7.2](#72-remaining-useful-life-regression-nasa-cmapss-fd001)
— that difference means the code has changed since those documents were last generated; verify
against the source files cited above, which is what this document did.*
