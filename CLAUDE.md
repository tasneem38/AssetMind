# CLAUDE.md — AssetMind operating instructions

This file is read at the start of every session. Keep it tight and operational.
For the narrative "how this works and why" read **PROJECT.md**.
For the full list of known issues, bugs, and half-finished work read **GAPS.md**.

## What this project is (one paragraph)

A hackathon/demo industrial-maintenance platform: FastAPI + PostgreSQL backend serving
synthetic equipment/work-order/incident/inspection data, a ChromaDB RAG chatbot over OEM PDF
manuals (answers via Sarvam AI), two standalone ML demos (RandomForest failure classifier,
XGBoost RUL regressor) trained on unrelated public datasets, and a React 19 + Vite + Tailwind
v4 frontend. See PROJECT.md for the full architecture.

## Commands that matter

**There is no `requirements.txt` in this repo (see GAPS.md #3).** Until one is added, install
manually:
```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install fastapi uvicorn sqlalchemy psycopg2-binary pydantic python-dotenv \
    chromadb sentence-transformers sarvamai pypdf langchain-text-splitters \
    scikit-learn xgboost pandas numpy
```

**Database seed script:** You can populate the database by running `python backend/scripts/seed_data.py`. This script automatically creates the `equipment`, `work_order`, `incident_report`, and `inspection_report` tables and loads data from `data/*.csv`.

**Run the backend** (must be run from inside `backend/`, imports are `app.*`):
```bash
cd backend
python -m uvicorn app.main:app --reload --port 8000
```
Interactive API docs (always accurate, unlike README.md — see GAPS.md #2): `http://localhost:8000/docs`

**Train the ML models** (run from anywhere — these two scripts resolve paths from `__file__`):
```bash
python backend/scripts/train_ai4i.py     # writes backend/models/ai4i_model.pkl, ai4i_scaler.pkl
python backend/scripts/train_cmapss.py   # writes backend/models/cmapss_model.pkl, cmapss_scaler.pkl
```
`backend/models/*.pkl` are gitignored — you must run these before `/predict/*` works. Missing
models return HTTP 503, not a crash.

**Ingest OEM manuals into ChromaDB** (must `cd` into `backend/scripts/` first — this script,
unlike the training scripts, uses relative paths — see GAPS.md #18):
```bash
cd backend/scripts
python ingest_manuals.py
```
Writes to `backend/chroma_db/`, collection name `assetmind_manuals`. Also gitignored.

**Run the frontend**:
```bash
cd frontend
npm install
npm run dev      # http://localhost:5173
```

**Lint** (frontend only — no backend lint/format config exists):
```bash
cd frontend
npm run lint
```

**Tests**: none exist, frontend or backend (see GAPS.md #9). `backend/scripts/test_collection.py`
and `test_rag.py` are manual smoke scripts you run and eyeball, not part of any test runner.

## Conventions this codebase actually follows

- **Backend**: raw SQLAlchemy Core (`text()` SQL + `engine.connect()` or `SessionLocal()`), no
  ORM models, no migrations. Every DB-touching function lives in
  `backend/app/services/postgres_service.py` or `backend/app/services/ml_service.py`, called
  from thin route handlers in `backend/app/routes/*.py`. Follow this pattern for new endpoints:
  route function does request/response shaping + `HTTPException` handling; actual SQL/logic
  goes in a `services/*.py` function.
- **Route error handling**: the correct pattern (used in `dashboard.py`, `predict.py`) is
  `try: return service_fn(...) except Exception as exc: raise HTTPException(500, str(exc))`,
  plus explicit `HTTPException(404, ...)` when a lookup returns no row. `equipment.py` does NOT
  consistently follow this (see GAPS.md #12) — when touching `equipment.py`, bring it in line
  with the rest rather than copying its existing pattern.
- **Frontend**: functional components, local `useState`/`useEffect` per page, no global state
  library despite what the README says (see GAPS.md #15). All backend calls go through named
  functions in `frontend/src/services/api.js` — add new API calls there, don't inline `axios`
  calls in components.
- **Styling**: Tailwind v4 with a custom `@theme` block of CSS variables in
  `frontend/src/styles/global.css` (colors: `--color-primary`, `--color-bg`, `--color-text-main`,
  etc.), consumed via Tailwind arbitrary-value syntax `text-[var(--color-text-main)]`. Reusable
  component classes `.card`, `.card-header`, `.card-body`, `.btn`, `.btn-primary`, `.btn-outline`
  are defined once in `global.css` — reuse them instead of rewriting Tailwind utility soup.
  `index.css` and `App.css` are dead leftover files (GAPS.md #16) — do not add styles there.

## Gotchas — things that look like they should work one way but don't

- **The README's API reference table is wrong.** Real routes have no `/api` prefix: it's
  `/equipment`, `/dashboard`, `/insights`, `/predict`, `/ask` — not `/api/assets`, `/api/query`,
  etc. Always check `backend/app/main.py` + the relevant `backend/app/routes/*.py` file, never
  the README, for the real API surface (GAPS.md #2).
- **`ingest_manuals.py` needs `cwd=backend/scripts/`**; `train_ai4i.py`/`train_cmapss.py` don't
  care about cwd. Don't assume scripts in the same folder behave the same way (GAPS.md #18).
- **Starting the backend without running `ingest_manuals.py` or setting `SARVAM_API_KEY` first
  can crash the *entire* app at import time**, not just the RAG routes, because
  `backend/app/routes/rag.py` builds its ChromaDB/SentenceTransformer/SarvamAI clients at module
  import time with `get_collection` (which throws if the collection doesn't exist yet). If you
  need the rest of the API working without RAG set up, either finish RAG setup first or patch
  `get_collection` → `get_or_create_collection` (GAPS.md #17).
- **The `/predict/*` ML endpoints are unrelated to any specific equipment record.** They take
  raw sensor values and run two models trained on public datasets (AI4I 2020, NASA CMAPSS), not
  on anything in the `equipment`/`work_order`/etc. Postgres tables. Don't expect a prediction to
  reflect a given `equipment_id`'s actual history.
- **RUL/`degradation_trend` output is currently miscalibrated** — the model is trained with RUL
  clipped at 130 cycles but `ml_service.py` scores it against a 0–400 range, so "Stable"/
  "Healthy" trends are nearly unreachable. Known bug, see GAPS.md #6 before trusting or
  "fixing" this output.
- **`get_equipment_by_id` returns HTTP 200 with `{"error": "..."}`** on a missing row instead of
  a 404, unlike every other route in the file. Don't copy this pattern into new code
  (GAPS.md #12).
- Frontend `api.js` baseURL is hardcoded to `http://127.0.0.1:8000` — changing backend port/host
  requires editing `frontend/src/services/api.js` directly, `VITE_API_URL` is not actually read
  anywhere despite the README implying otherwise (GAPS.md #14).

## Rules — what to be careful with

- **`backend/app/db.py`** — the one place `DATABASE_URL` lives (currently hardcoded, see
  GAPS.md #4). Any code touching DB access ultimately depends on `engine`/`SessionLocal` from
  here.
- **`backend/app/services/postgres_service.py`** — the risk-score formula
  (`incident_count*0.4 + avg_inspection_risk*0.4 + open_followups*0.2`) and health-score formula
  are duplicated by description across `equipment.py`'s docstring and `dashboard.py`'s
  docstring. If you change the formula, update it in exactly one place
  (`postgres_service.py`) and make sure the docstrings elsewhere stay accurate — don't
  reimplement the formula a second time anywhere.
- **Generated / gitignored — do not expect these in git, do not commit them**:
  `backend/models/*.pkl`, `backend/chroma_db/`, any `.env` file, `frontend/dist/`,
  `frontend/build/`.
- **Do not delete/"clean up" `backend/models/*.pkl` or `backend/chroma_db/` casually** — they
  are the only trained artifacts and are expensive to regenerate (retraining + re-ingesting 9
  PDFs). If asked to "reset" the project, confirm with the user first.
- **The empty stub files** in `backend/api/`, `backend/services/`, `backend/db/`,
  `backend/main.py`, `graph/build_graph.py`, `rag/ingestion_pipeline.py` are dead and unimported
  (GAPS.md #7). Safe to delete; do not add new code to them thinking they're the "real" module —
  the real backend package is `backend/app/`.
- **`backend/app/routes/rag.py`'s `ask_copilot()` function has ~100 lines of unreachable dead
  code after its first `return`** (GAPS.md #8). If you edit the confidence/risk-category/
  root-cause logic, make sure you're editing the *live* block (before the first `return`), and
  ideally delete the dead copy while you're in there.

## Where to look for more

- **PROJECT.md** — architecture, data flow diagrams, tech-stack rationale, what's load-bearing
  vs. safe to change, surprising things about how the pieces connect.
- **GAPS.md** — the full, severity-ordered list of bugs, security issues, dead code, missing
  tests, and half-finished features, each with file paths and a scoped fix.
