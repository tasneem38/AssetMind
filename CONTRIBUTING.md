# Contributing to AssetMind

## Welcome

AssetMind is an industrial asset intelligence platform combining a PostgreSQL-backed operations
dashboard, two predictive-maintenance ML models (RandomForest + XGBoost), and a RAG-powered
maintenance Copilot (ChromaDB + Sarvam AI). It was built as a hackathon/portfolio project by
Team CREW 1.0 and is maintained as a proof of concept — see `PROJECT.md` for the full technical
architecture before making non-trivial changes.

This guide is for human contributors and AI coding assistants alike. Read
[§9 AI Contributor Notes](#9-ai-contributor-notes) if you are an AI agent working on this repo.

---

## 1. Repository Structure

```
AssetMind/
├── backend/
│   ├── app/
│   │   ├── main.py                # FastAPI app, router registration, CORS
│   │   ├── db.py                  # SQLAlchemy engine/session (reads DATABASE_URL)
│   │   ├── config.py               # SARVAM_API_KEY → GEMINI_API_KEY env mapping
│   │   ├── routes/                 # One file per API area (equipment, dashboard, insights, predict, rag)
│   │   └── services/                # Business logic: postgres_service, ml_service, equipment_parser
│   ├── scripts/
│   │   ├── seed_data.py             # Creates schema + view + indexes, loads CSVs into Postgres
│   │   ├── ingest_manuals.py        # Chunks + embeds OEM manual PDFs into ChromaDB
│   │   ├── train_ai4i.py            # Trains the RandomForest failure classifier
│   │   └── train_cmapss.py          # Trains the XGBoost RUL regressor
│   ├── manuals/                    # 9 OEM manual PDFs (ingestion source)
│   ├── tests/                       # pytest suite (currently: ml_service coverage)
│   └── requirements.txt
├── data/
│   ├── equipment.csv, work_orders.csv, incident_reports.csv, inspection_reports.csv
│   ├── ai4i/                        # AI4I 2020 public dataset
│   └── cmapss/                      # NASA CMAPSS FD001 public dataset
├── frontend/
│   ├── src/
│   │   ├── pages/                   # Route-level views (Dashboard, Copilot, Insights, etc.)
│   │   ├── components/               # Shared UI (Sidebar, ProtectedRoute, RiskBadge, etc.)
│   │   ├── services/api.js           # Single axios instance + all API wrappers
│   │   └── styles/global.css         # Tailwind v4 design tokens
│   └── package.json
├── PROJECT.md         # Full technical architecture (read this first)
├── GAPS.md            # Known issues audit (may reflect an earlier code snapshot — verify against source)
├── CLAUDE.md           # Prior AI-agent onboarding notes (same caveat as GAPS.md)
└── README.md
```

---

## 2. Development Setup

### Prerequisites
- Python 3.11+
- Node.js 20+
- PostgreSQL 16 (running locally or reachable via `DATABASE_URL`)

### Backend

```bash
cd backend
python -m venv venv && source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Set environment variables (there is currently no `.env.example` in this repository — create a
`.env` file in `backend/` with the two variables the code actually reads):

```env
DATABASE_URL=postgresql://<user>:<password>@localhost:5432/assetmind
SARVAM_API_KEY=<your Sarvam AI key>       # required for /ask/* routes
```

> If `DATABASE_URL` is unset, `app/db.py` falls back to a hardcoded local default. Set it
> explicitly rather than relying on the fallback.

```bash
python scripts/seed_data.py          # creates schema + view + indexes, loads data/*.csv
python scripts/ingest_manuals.py     # embeds backend/manuals/*.pdf into ChromaDB
python scripts/train_ai4i.py         # trains + saves the RandomForest model
python scripts/train_cmapss.py       # trains + saves the XGBoost model
uvicorn app.main:app --reload --port 8000     # run from inside backend/
```

`seed_data.py` **truncates** the four operational tables before reloading — do not run it
against data you want to keep.

### Frontend

```bash
cd frontend
npm install
echo "VITE_API_URL=http://localhost:8000" > .env.local
npm run dev
```

### Verifying your setup

- Backend: visit `http://localhost:8000/docs` — you should see all five router groups.
- Frontend: visit `http://localhost:5173`, log in with the demo credentials in `Login.jsx`, and
  confirm the Dashboard loads real numbers (not zeros/errors).

---

## 3. Coding Standards

### Backend (Python)

- **Match the existing raw-SQL pattern.** This project intentionally does not use an ORM layer
  or declarative models (see `PROJECT.md` §5 and §11). New queries should use
  SQLAlchemy `text()` with **bound parameters** (e.g. `{"eid": equipment_id}`), never
  string-interpolated SQL.
- **Put derived-metric logic in `postgres_service.py`, not in route files.** Route handlers in
  `app/routes/*.py` should stay thin — fetch data via a service function and shape the HTTP
  response. If you're writing a `SELECT` with a `GROUP BY`/aggregate directly inside a route
  file, consider whether it belongs in `postgres_service.py` instead.
- **One formula, one place.** The risk-score and health-score formulas each exist in exactly one
  place (`equipment_risk_scores` SQL view and `postgres_service.get_health_score`,
  respectively). If you change a formula, update it there — do not reimplement it elsewhere.
- **Errors**: route handlers generally catch broad exceptions and re-raise as
  `HTTPException(status_code=500, ...)`, with `FileNotFoundError` → `503` for missing ML
  artifacts. Follow this pattern for new endpoints rather than letting unhandled exceptions
  produce raw tracebacks.
- **Type hints**: `predict.py` uses Pydantic models for request/response validation — do this
  for any new POST endpoint rather than accepting an untyped `dict`.

### Frontend (React)

- **All network calls go through `frontend/src/services/api.js`.** Add new endpoint wrappers
  there rather than calling `axios` directly from a component.
- **Use the existing design tokens.** Colors and spacing come from CSS variables defined in
  `src/styles/global.css` and consumed via Tailwind's `[var(--color-x)]` arbitrary-value
  syntax — don't hardcode hex colors in components.
- **Component/page split**: route-level views live in `src/pages/`; reusable pieces
  (cards, badges, layout chrome) live in `src/components/`. Keep this separation for new UI.
- **Formatting**: run `npm run lint` (ESLint, flat config in `frontend/eslint.config.js`,
  React Hooks + React Refresh rules enabled) before opening a PR.

---

## 4. Branching Strategy

`Not verifiable from repository` — no branch protection rules, `CODEOWNERS`, or documented
branching convention currently exist in this repo. Until the maintainers establish one, use a
conventional approach:

- `feature/<short-description>` for new functionality
- `fix/<short-description>` for bug fixes
- `docs/<short-description>` for documentation-only changes

Open a pull request against `main` rather than pushing directly.

---

## 5. Pull Request Checklist

Before opening a PR:

- [ ] Backend changes: relevant `.py` files run without import errors (`python -c "import app.main"` from `backend/`)
- [ ] Frontend changes: `npm run lint` passes with no new errors
- [ ] New/changed API behavior is reflected in `PROJECT.md` §10 (API Architecture) if applicable
- [ ] New backend logic that's non-trivial has a corresponding test in `backend/tests/`
- [ ] No secrets, API keys, or credentials committed (check your diff for `SARVAM_API_KEY`,
      `DATABASE_URL`, etc.)
- [ ] UI changes include a before/after screenshot in the PR description
- [ ] If you changed a shared formula (risk score, health score), confirm it's still defined in
      exactly one place

---

## 6. Testing

### Backend

```bash
cd backend
pytest
```

As of this writing, `backend/tests/test_ml_service.py` covers `predict_failure` and
`predict_rul` (valid inputs, and the wrong-length-input error path). There is no test coverage
yet for the route layer, `postgres_service.py`, or the RAG pipeline — contributions adding tests
in these areas are welcome. Follow the existing file's style: plain `pytest` functions, no
fixtures/mocking framework currently in use.

### Frontend

There is no automated frontend test suite in this repository. Verify UI changes manually against
a running backend (see [§2](#2-development-setup)).

### ML models

Re-run the relevant training script and compare printed metrics against the values documented in
`PROJECT.md` §7:

```bash
python scripts/train_ai4i.py      # compare accuracy/ROC-AUC to PROJECT.md §7.1
python scripts/train_cmapss.py    # compare MAE/RMSE to PROJECT.md §7.2
```

Metrics are not persisted to a file — you must re-run the script to verify them, and update
`PROJECT.md` if retraining meaningfully changes the reported numbers.

---

## 7. Adding Features

**Add an API endpoint**: add a route function to the relevant file in `app/routes/`, add any new
query logic to `app/services/postgres_service.py` (not inline in the route), register a
Pydantic request/response model if it's a POST endpoint, and document it in `PROJECT.md` §10.

**Add a frontend page**: create the component in `src/pages/`, add a route in `App.jsx` (inside
the `/app` `<ProtectedRoute>` block if it needs authentication-gated access), and add any needed
API wrapper functions to `src/services/api.js`.

**Retrain an ML model**: edit the relevant script in `backend/scripts/` (`train_ai4i.py` or
`train_cmapss.py`), re-run it, and confirm `backend/models/*.pkl` regenerated successfully. Note
that these `.pkl` files are gitignored — each contributor trains their own local copies.

**Update RAG documents**: drop new/updated PDFs into `backend/manuals/`, then re-run
`python scripts/ingest_manuals.py`. This re-embeds and adds to the existing ChromaDB collection
— it does not currently remove stale chunks for manuals you've deleted, so if you replace a
manual, consider clearing `backend/chroma_db/` first and re-ingesting everything.

**Modify the database schema**: edit the `CREATE TABLE`/`CREATE VIEW` statements in
`backend/scripts/seed_data.py` (the only schema source of truth in this repo — see
`PROJECT.md` §9), then re-run the script against a database you're comfortable truncating.

---

## 8. Common Pitfalls

- **Working directory matters for some scripts, not others.** `train_ai4i.py` and
  `train_cmapss.py` resolve paths relative to `__file__`, so they run correctly from anywhere.
  Always run backend commands (`uvicorn`, `pytest`, `python scripts/...`) from inside `backend/`
  so the `app.*` import path resolves correctly.
- **The `/predict/*` endpoints are not tied to any `equipment_id`.** Don't build features that
  assume a prediction reflects a specific asset's history — it doesn't, by current design (see
  `PROJECT.md` §7.4).
- **`app/routes/rag.py` builds its ChromaDB/SentenceTransformer/Sarvam clients at import time.**
  If you're debugging a startup failure that doesn't seem related to your change, check whether
  ChromaDB (`backend/chroma_db/`) exists and is reachable, and whether `SARVAM_API_KEY` is set.
- **`seed_data.py` is destructive.** It truncates `equipment`, `work_order`, `incident_report`,
  and `inspection_report` every time it runs. Don't run it against a database with data you
  haven't backed up.
- **This project's own documentation can drift.** `GAPS.md` and `CLAUDE.md` in this repository
  reflect a snapshot of the code at some point in the past and have not been kept in sync with
  every change — for example, an RUL calibration issue they describe has since been fixed in
  `ml_service.py`. When in doubt, verify against the source file, not the docs.

---

## 9. AI Contributor Notes

If you are an AI coding assistant working on this repository:

- **Verify before writing.** This repository's own `GAPS.md`/`CLAUDE.md` files contain
  claims (e.g. "no requirements.txt exists", "RUL scoring is miscalibrated") that were true at
  the time they were written but are **no longer accurate** — `requirements.txt` and
  `seed_data.py` now exist, and the RUL calibration bug has been fixed. Always confirm current
  behavior by reading the actual source file before citing it in a PR description, commit
  message, or generated documentation. Do not assume prior audit documents are current.
- **Preserve the raw-SQL architecture** unless the task explicitly asks you to introduce an ORM.
  Don't silently convert a route to use declarative models as a "cleanup" — it's an
  architectural decision documented in `PROJECT.md` §11, not an oversight.
- **Don't fabricate metrics.** ML performance numbers in `PROJECT.md` come from running the
  training scripts and reading their console output — there is no metrics file to copy from. If
  you need current metrics and haven't run the scripts, say so rather than reproducing a
  previously-seen number as if it were freshly verified.
- **Files that are effectively append-only reference material**: `data/*.csv`,
  `data/ai4i/`, `data/cmapss/`, and `backend/manuals/*.pdf` are source datasets. Don't modify
  their contents to "fix" a downstream bug — fix the code that consumes them.
- **Generated/gitignored — do not expect to find these in git and do not commit them**:
  `backend/models/*.pkl`, `backend/chroma_db/`, any `.env` file, `frontend/dist/`.
- **Keep formula changes centralized.** If asked to adjust the risk-score or health-score logic,
  change it in `equipment_risk_scores` (the SQL view in `seed_data.py`) or
  `postgres_service.get_health_score` respectively — not in a route file — and check for any
  other place that might have duplicated the same calculation before assuming there's only one.
- **When generating documentation**, mark anything you could not verify directly against source
  as `Not verifiable from repository` rather than inferring or guessing — this repository's
  maintainer has explicitly asked for this convention (see `PROJECT.md`'s header).

---

## 10. Documentation Style

- **GitHub-flavored Markdown** throughout; use `> [!NOTE]`, `> [!WARNING]`, `> [!CAUTION]`
  callouts for anything a reader could miss and later get burned by (as used in `PROJECT.md`
  and this file).
- **Mermaid diagrams** (` ```mermaid ` code blocks) for architecture, sequence, and ER diagrams
  — GitHub renders these natively, so no external image generation is needed. Keep diagrams
  scoped to one concern each (don't try to fit the whole system into a single flowchart).
- **Tables** for anything enumerable and comparable (API references, tech stack, PR checklists)
  rather than long bullet lists.
- **Code comments**: match the existing style in each file — `app/routes/*.py` and
  `app/services/*.py` favor short docstrings on public functions describing inputs/outputs over
  inline comments; the RAG and ML modules use section-header comments (`# ── Section ──`) to
  divide files into logical blocks. Follow whichever convention the file you're editing already
  uses.
- **Every technical claim in new documentation should be traceable to a specific file.** Cite
  the file (and function, where useful) a claim is verified against, the way `PROJECT.md` does
  — this is what makes documentation trustworthy to the next reader, human or AI.
