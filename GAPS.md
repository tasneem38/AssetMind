# GAPS.md — Honest audit of AssetMind

Ordered most severe first. Each item: what it is, where it lives, why it matters, suggested fix.
Fixes are scoped to be doable as a single, self-contained task.

> **Note: All items below have been FIXED / RESOLVED in this session.**

---

## 1. [BLOCKER] No way to create or populate the database from this repo

**What**: The README instructs `alembic upgrade head` and `python scripts/seed_data.py`, but
there is no `alembic/` directory, no `alembic.ini`, no `scripts/seed_data.py`, no SQL schema
file, and no SQLAlchemy declarative model classes anywhere in the repo. `backend/app/db.py`
only creates an `engine`/`SessionLocal` against a database assumed to already exist with the
right tables.

**Where**: Absence is repo-wide. Closest evidence of the intended schema: SQL strings in
`backend/app/services/postgres_service.py` and `backend/app/routes/equipment.py` (columns like
`equipment_id`, `criticality`, `equipment_type`, `risk_score`, `follow_up_required`,
`failure_mode`, `preventable`), and CSVs in `data/equipment.csv`, `data/work_orders.csv`,
`data/incident_reports.csv`, `data/inspection_reports.csv`.

**Why it matters**: A new developer (or the next model working on this repo) literally cannot
get the backend into a working state without reverse-engineering the schema by hand. This is
the single biggest onboarding blocker.

**Suggested fix**: Write one script, `backend/scripts/seed_data.py`, that:
1. Creates the 4 tables (`equipment`, `work_order`, `incident_report`, `inspection_report`) with
   columns inferred from the CSV headers and the SQL in `postgres_service.py`/`equipment.py`
   (cross-reference both to get the full column list, including `risk_score`,
   `follow_up_required`, `preventable`, `failure_mode` which appear in SQL but should be checked
   against CSV headers for exact spelling).
2. Loads each CSV in `data/` into the matching table with `pandas.read_sql`/`to_sql` or raw
   `INSERT`.
Add a one-line note to `README.md` and `CLAUDE.md` once this exists.

---

## 2. [BLOCKER] README API reference doesn't match the real API

**What**: `README.md`'s "API Reference" table lists endpoints like `GET /api/assets`,
`POST /api/query`, `GET /api/dashboard/kpis`, `GET /api/knowledge-gaps`. None of these paths
exist. The real mounted routers (see `backend/app/main.py`) have no `/api` prefix and different
names: `/equipment/*`, `/dashboard/*`, `/insights/*`, `/predict/*`, `/ask/*`.

**Where**: `README.md` lines ~291–307 vs. `backend/app/main.py` + `backend/app/routes/*.py`.

**Why it matters**: Anyone (human or model) trying to integrate against this API using the
README will get 404s on every single documented endpoint. This is actively misleading, worse
than having no docs at all.

**Suggested fix**: Regenerate the API Reference table in `README.md` by reading the actual
`router = APIRouter(prefix=...)` declarations and `@router.get/post(...)` decorators in each
file under `backend/app/routes/`, and replace the existing table with the real paths (or just
link to `/docs`, which is auto-generated and always correct).

---

## 3. [BLOCKER] No `requirements.txt`, no dependency manifest of any kind

**What**: README says `pip install -r requirements.txt`; no such file exists anywhere in the
repo (confirmed via full-repo search).

**Where**: Repo root and `backend/` — absent. Dependencies must be inferred from `import`
statements across `backend/app/**/*.py` and `backend/scripts/*.py`.

**Why it matters**: Cannot `pip install` anything; every environment setup starts from scratch
guesswork.

**Suggested fix**: Create `backend/requirements.txt` with (at minimum, based on current
imports): `fastapi`, `uvicorn`, `sqlalchemy`, `psycopg2-binary`, `pydantic`, `python-dotenv`,
`chromadb`, `sentence-transformers`, `sarvamai`, `pypdf`, `langchain-text-splitters`,
`scikit-learn`, `xgboost`, `pandas`, `numpy`. Pin versions by running `pip freeze` in a working
dev environment once one exists.

---

## 4. [SECURITY — HIGH] Hardcoded database credentials in source

**What**: `DATABASE_URL = "postgresql://postgres:mypassword@localhost:5432/assetmind"` is a
literal hardcoded string, not read from an environment variable, despite the README's
`.env.example` implying `DATABASE_URL` should be configurable.

**Where**: `backend/app/db.py`, line 4.

**Why it matters**: Real or placeholder, this pattern means secrets get committed to git by
default and there is no way to point at a different DB (staging, CI, another dev's machine)
without editing source. If this password is ever reused on a real deployment, it's now public.

**Suggested fix**:
```python
import os
from dotenv import load_dotenv
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:mypassword@localhost:5432/assetmind")
```
and add `DATABASE_URL` to a real `.env.example` file (which also doesn't currently exist).

---

## 5. [SECURITY — HIGH] Zero authentication/authorization on the entire backend API

**What**: No FastAPI dependency, middleware, header check, or session mechanism exists anywhere
in `backend/app/`. Every route in `/equipment`, `/dashboard`, `/insights`, `/predict`, `/ask` is
fully open. `Login.jsx` on the frontend is a purely client-side check
(`email === 'demo@assetmind.com' && password === 'demo'`) that just calls `navigate('/app')` —
it never talks to the backend at all, and `/app/*` routes are not otherwise guarded (typing the
URL directly bypasses "login" entirely).

**Where**: Entire `backend/app/` (absence); `frontend/src/pages/Login.jsx`.

**Why it matters**: Fine for a local demo. Actively dangerous if this is ever deployed anywhere
reachable over a network, since anyone can hit every endpoint, including the LLM-backed `/ask`
routes (cost/abuse risk) with no rate limiting either.

**Suggested fix (scoped small)**: For now, just document this loudly in `README.md`
("⚠ No authentication — do not deploy publicly without adding one"). If real auth is wanted
later, add a single FastAPI `Depends()` checking a static API key from an env var as a first
step, then a real session system.

---

## 6. [BUG] RUL health-score / degradation-trend math doesn't match how the model was trained

**What**: `backend/scripts/train_cmapss.py` clips the RUL training target at
`MAX_RUL = 130` cycles (`df["RUL"].clip(upper=MAX_RUL)`), so the model has only ever learned to
predict values in roughly the 0–130 range. But `backend/app/services/ml_service.py`
(`predict_rul`) assumes a 0–400 cycle range for `health_score`
(`max_rul = 400.0; health_score = round(min((rul_pred/max_rul)*100, 100))`) and uses raw cycle
thresholds of 100/200/300 for `degradation_trend` ("Critical" < 100, "Declining" < 200,
"Stable" < 300, else "Healthy").

**Where**: `backend/scripts/train_cmapss.py` (`MAX_RUL = 130`) vs.
`backend/app/services/ml_service.py` (`max_rul = 400.0`, thresholds 100/200/300).

**Why it matters**: Since the model can basically never output more than ~130,
`health_score` will almost always land under ~33/100, and `degradation_trend` will almost never
report "Stable" or "Healthy" — the model's real output range simply doesn't reach those
thresholds. This directly undermines the credibility of the core "RUL prediction" feature: the
demo will show almost everything as "Critical" or "Declining" regardless of actual input health.

**Suggested fix**: Change `ml_service.py` to use `max_rul = 130.0` (matching training) and
rescale the `degradation_trend` thresholds proportionally (e.g. `< 32` Critical, `< 65`
Declining, `< 100` Stable, `>= 100` Healthy), or retrain with a larger `MAX_RUL` if a wider
dynamic range is wanted. Whichever direction is chosen, the two files must agree.

---

## 7. [DEAD CODE] Two full backend module trees are empty and unused

**What**: `backend/api/*.py` (6 files: `equipment.py`, `graph.py`, `incidents.py`,
`inspections.py`, `predictions.py`, `rag.py`), `backend/services/*.py` (5 files:
`ai4i_service.py`, `graph_service.py`, `rag_service.py`, `risk_engine.py`, `rul_service.py`), and
`backend/db/*.py` (2 files: `postgres.py`, `schemas.py`) are **all 0 bytes**. Also 0 bytes:
`backend/main.py`, top-level `graph/build_graph.py`, top-level `rag/ingestion_pipeline.py`.
That's 15 empty files across 5 directories, none imported anywhere.

**Where**: `backend/api/`, `backend/services/`, `backend/db/`, `backend/main.py`, `graph/`,
`rag/` (top-level).

**Why it matters**: Confuses navigation badly — a newcomer will naturally look in
`backend/services/risk_engine.py` for risk-scoring logic (a very plausible name) and find
nothing, when the real logic is in `backend/app/services/postgres_service.py`'s
`_risk_level()`/`get_all_equipment_risk_scores()`. Looks like an abandoned restructuring
(flat `backend/` → `backend/app/` package) where old files were emptied but never `git rm`'d.

**Suggested fix**: Delete all 15 files and the now-empty directories
(`backend/api/`, `backend/services/`, `backend/db/`, top-level `graph/`, top-level `rag/`,
`backend/main.py`). Verify nothing imports them first (`grep -rn "from api\.\|from services\.\|from db\." backend/app` — should be empty since the real modules live under `app.services`, `app.db`, not top-level `services`/`db`).

---

## 8. [DEAD CODE] ~100 lines of unreachable duplicate code in `rag.py`

**What**: `ask_copilot()` in `backend/app/routes/rag.py` has a `return {...}` statement at
line ~407, followed immediately by another ~100 lines (408–507) that recompute
`confidence`, `risk_category`, `root_causes`, `recommended_actions`, and end in a second
identical `return {...}`. The second block is byte-for-byte unreachable dead code.

**Where**: `backend/app/routes/rag.py`, lines ~409–507 (everything after the first `return`
in `ask_copilot`).

**Why it matters**: If someone edits the "confidence" formula or risk-keyword list in the
live block and doesn't notice the dead copy below, the file becomes internally
inconsistent and confusing for the next reader (which formula is "real"?). Also just
inflates the file for no reason.

**Suggested fix**: Delete everything in `ask_copilot()` after the first `return {...}`
statement (roughly lines 409 to the end of the function).

---

## 9. [ZERO TEST COVERAGE] No automated tests anywhere, frontend or backend

**What**: There is no `pytest`, `unittest`, `vitest`, or `jest` anywhere in the repo. The
files named `backend/scripts/test_collection.py` and `backend/scripts/test_rag.py` are
manual smoke-test scripts (they just `print()` results) — they are not part of a real test
suite and are not runnable via a test runner. `frontend/package.json` has no `test` script
and no testing library installed.

**Where**: Whole repo.

**Why it matters — specifically untested critical paths**:
- The risk-score/health-score arithmetic in `postgres_service.py` (the numbers the whole
  Dashboard and Insights pages are built around) has no unit tests validating the formulas
  against known inputs.
- `ml_service.predict_failure`/`predict_rul` have no tests confirming input validation,
  shape mismatches, or the actual numeric output ranges (which would have caught gap #6
  above immediately).
- `equipment_parser.extract_id` has no tests, so its false-positive-prone regex (gap #12)
  has never been verified against real question text.
- No route-level tests (e.g. FastAPI `TestClient`) exist to confirm any endpoint returns
  the shape the frontend expects.

**Suggested fix (start small)**: Add `backend/tests/test_ml_service.py` with `pytest`,
covering: `predict_failure()` returns `risk_level` in `{"Low","Medium","High"}` and
`failure_probability` in `[0,1]`; `predict_rul()` raises `ValueError` for wrong-length input
and returns `remaining_useful_life >= 0`. Add `pytest` + a `test` note to `CLAUDE.md`. This
one file would have caught gap #6.

---

## 10. [FRAGILE] Session/result-object used after its `with` block has already closed

**What**: In `backend/app/services/postgres_service.py`, `get_incidents()`,
`get_inspections()`, and `get_work_orders()` all follow this shape:
```python
def get_incidents(equipment_id, limit=5):
    with SessionLocal() as db:
        result = db.execute(text("..."), {...})
    return result.mappings().all()   # <- outside the `with` block, indentation confirms it
```
The `return` line is indented to the function body level, **not** inside the `with` block, so
`result.mappings().all()` executes after the session has already been closed.

**Where**: `backend/app/services/postgres_service.py`, functions `get_incidents` (~line 9),
`get_inspections` (~line 29), `get_work_orders` (~line 49).

**Why it matters**: This currently "works" only because the underlying driver
(likely psycopg2) buffers the full result set client-side by default, so reading rows after
the session context manager exits happens to succeed. It is not guaranteed to keep working —
e.g. if the driver/config ever changes to server-side cursors, or under connection-pool
pressure, this will raise on `.mappings().all()` (something like "this connection is closed").
It's a landmine for a future edit that looks unrelated (e.g. adding connection pooling options).

**Suggested fix**: Move the `return` statement inside the `with` block for all three
functions:
```python
def get_incidents(equipment_id, limit=5):
    with SessionLocal() as db:
        result = db.execute(text("..."), {...})
        return result.mappings().all()
```

---

## 11. [PERFORMANCE] N+1 query pattern in knowledge-gap detection

**What**: `knowledge_gaps()` in `backend/app/routes/insights.py` fetches all inspection rows,
then inside a Python `for` loop over every single row, runs a separate `COUNT(*)` query
against `incident_report` for that row's `equipment_id`, and (conditionally) a second query for
the most common failure mode. With even a few hundred inspection rows this is hundreds of
round-trips per request.

**Where**: `backend/app/routes/insights.py`, `knowledge_gaps()`, lines ~34–65.

**Why it matters**: Will not scale past the current tiny synthetic dataset (50 inspections).
Any real deployment with thousands of inspection rows would make this endpoint extremely slow.

**Suggested fix**: Replace the per-row queries with two aggregate queries run once
up front (e.g. `SELECT equipment_id, COUNT(*) FROM incident_report GROUP BY equipment_id`
and a similar grouped query for the most common failure mode per equipment_id), then join
in Python using dictionaries keyed by `equipment_id` instead of hitting the DB inside the loop.
(`get_dashboard_stats()` and `get_all_equipment_risk_scores()` in `postgres_service.py` already
demonstrate the correct grouped-subquery pattern to follow.)

---

## 12. [INCONSISTENCY] Error handling is inconsistent across routes

**What**: Most routes (`dashboard.py`, `predict.py`, and the `insights.py` endpoints that call
`postgres_service`) wrap logic in `try/except` and raise `HTTPException(status_code=500, ...)`
on failure. But `equipment.py`'s `get_equipment_by_id()` has no try/except and, on a missing
row, returns `{"error": "Equipment not found"}` with an implicit **200 OK** status instead of a
404. Other functions in the same file (`get_equipment_briefing`, `get_timeline`) have no error
handling at all and will raise an unhandled 500 with a raw traceback if `equipment` is `None`
(e.g. `equipment_data = dict(equipment._mapping)` will throw `AttributeError` on `None`).

**Where**: `backend/app/routes/equipment.py` — compare `get_equipment_by_id` (line ~248) to
`get_equipment_briefing` (line ~33) to `get_equipment_health` (line ~276, which does use
try/except).

**Why it matters**: The frontend can't rely on a consistent contract ("errors are always a 4xx
with a `detail` field") — sometimes it's a 200 with an `error` key, sometimes an unhandled 500
with no `detail` field at all. `frontend/src/services/api.js` callers that check
`err?.response?.data?.detail` (see `Copilot.jsx`) will get `undefined` from some of these
failure modes.

**Suggested fix**: Standardize on `raise HTTPException(status_code=404, detail="Equipment not
found")` when a lookup returns no row, across every function in `equipment.py`. Add a not-found
check immediately after every `fetchone()`/`scalar()` call that can legitimately return
nothing.

---

## 13. [HALF-FINISHED] Cognee graph-sync feature is completely broken

**What**: `backend/app/ingestion/run_cognee_sync.py` imports
`from app.schemas.graph_schemas import EquipmentNode, IncidentNode, WorkOrderNode,
InspectionNode` — but `app/schemas/` **does not exist anywhere in the repo**. It also imports
`cognee` (with a `# pyrefly: ignore [missing-import]` comment acknowledging the import can't be
resolved), which is not referenced by any dependency list. This script cannot run in its
current state.

**Where**: `backend/app/ingestion/run_cognee_sync.py`, whole file. Not imported by
`app/main.py` or any route, so it doesn't affect the running app — but it does appear in the
directory tree as if it's a working feature.

**Why it matters**: A future contributor might try to "finish" or "fix" this file assuming it's
close to working, without realizing the entire schema module it depends on was never created.
Also signals an abandoned integration with a "Cognee" knowledge-graph product that isn't
mentioned anywhere else in the codebase or README.

**Suggested fix**: Either (a) delete this file and its `backend/app/ingestion/` directory
entirely until the graph feature is actually prioritized, or (b) if it's wanted, create the
missing `backend/app/schemas/graph_schemas.py` with simple dataclasses/Pydantic models for
`EquipmentNode`/`IncidentNode`/`WorkOrderNode`/`InspectionNode` and add `cognee` to
`requirements.txt`. Option (a) is the safe, small task.

---

## 14. [CONFIG] Frontend API base URL is hardcoded, contradicting the README's env-var story

**What**: `frontend/src/services/api.js` hardcodes
`axios.create({ baseURL: 'http://127.0.0.1:8000' })`. The README instructs creating
`frontend/.env.local` with `VITE_API_URL=http://localhost:8000`, but no code anywhere reads
`import.meta.env.VITE_API_URL`, and there is no `.env.example` file for the frontend either.

**Where**: `frontend/src/services/api.js`, line 4.

**Why it matters**: The app can only ever talk to a backend on `127.0.0.1:8000`. It cannot be
pointed at a staging/deployed backend, a different port, or run in any hosted environment
without a source change.

**Suggested fix**:
```js
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000',
});
```
and add `frontend/.env.example` containing `VITE_API_URL=http://localhost:8000`.

---

## 15. [INCONSISTENCY] README claims global state management that doesn't exist

**What**: `README.md`'s tech-stack table lists "State: React Context + useReducer". A
repo-wide search finds zero uses of `createContext` or `useReducer` anywhere in
`frontend/src/`. Every page manages its own `useState`/`useEffect` independently and refetches
from the API on every mount — e.g. navigating Dashboard → Assets → Dashboard re-triggers all
three dashboard API calls again with no caching.

**Where**: `README.md` tech stack table vs. all files under `frontend/src/pages/`.

**Why it matters**: Sets the wrong expectation for anyone planning to add a new page that needs
shared state (e.g. "which equipment is currently selected across pages") — there is no context
to hook into; it would need to be built from scratch.

**Suggested fix**: Either fix the README claim to say "local component state (useState/
useEffect), no global store", or — if shared state is actually wanted — introduce one small
`EquipmentContext` for the currently-viewed equipment ID as a first real usage, and update the
README to match reality either way.

---

## 16. [MINOR / DEAD CODE] Unused leftover Vite template CSS files

**What**: `frontend/src/index.css` (111 lines) and `frontend/src/App.css` (184 lines) are
never imported by anything (`main.jsx` only imports `./styles/global.css`). They're leftover
from the default Vite React template plus some experimentation.

**Where**: `frontend/src/index.css`, `frontend/src/App.css`.

**Why it matters**: Minor, but wastes a newcomer's time wondering which CSS file actually
controls the design system (answer: only `styles/global.css`).

**Suggested fix**: Delete both files after confirming (`grep -rn "index.css\|App.css"
frontend/src`) nothing imports them.

---

## 17. [FRAGILE] RAG route crashes app startup if setup order is wrong

**What**: `backend/app/routes/rag.py` runs this at **module import time** (i.e., at FastAPI
app startup, since `app/main.py` imports this router unconditionally):
```python
client = chromadb.PersistentClient(path=os.path.join(BASE_DIR, "chroma_db"))
collection = client.get_collection("assetmind_manuals")   # raises if collection doesn't exist
model = SentenceTransformer("all-MiniLM-L6-v2")            # downloads/loads model from disk
sarvam_client = SarvamAI(api_subscription_key=os.getenv("SARVAM_API_KEY"))
```
`get_collection` (not `get_or_create_collection`) throws if `ingest_manuals.py` hasn't been run
yet. There's no try/except around any of this.

**Where**: `backend/app/routes/rag.py`, lines 14, 27–33, 35–37.

**Why it matters**: If a developer runs `uvicorn app.main:app` before running
`ingest_manuals.py`, or without a `SARVAM_API_KEY` set, the **entire API fails to start** —
including the completely unrelated `/equipment`, `/dashboard`, `/predict` endpoints that have
nothing to do with RAG. A partial-setup developer gets a total outage instead of a working
subset of the app.

**Suggested fix**: Change `get_collection` to `get_or_create_collection` (matches
`ingest_manuals.py`'s own pattern) so an empty collection doesn't crash startup, and wrap the
`SarvamAI(...)` client construction in a check that logs a warning instead of raising if
`SARVAM_API_KEY` is unset (the `/ask` endpoints can then fail gracefully per-request instead of
at import time).

---

## 18. [INCONSISTENCY] `ingest_manuals.py` uses relative paths; training scripts use absolute paths

**What**: `backend/scripts/ingest_manuals.py` hardcodes `MANUALS_DIR = Path("../manuals")` and
`CHROMA_DIR = "../chroma_db"` — both relative to whatever the current working directory happens
to be when the script is invoked. `backend/scripts/train_ai4i.py` and `train_cmapss.py`, by
contrast, compute all paths from `os.path.abspath(__file__)` and work regardless of cwd.

**Where**: `backend/scripts/ingest_manuals.py` lines 16, 18, vs. `train_ai4i.py`/
`train_cmapss.py`'s `_SCRIPT_DIR`/`_BACKEND_DIR` pattern.

**Why it matters**: Running `python backend/scripts/ingest_manuals.py` from the repo root (a
very natural thing to do) silently looks for manuals/writes ChromaDB data in the wrong place
(`../manuals` relative to repo root, which doesn't exist) rather than erroring clearly — it
depends on the exact directory you `cd`'d into.

**Suggested fix**: Rewrite `ingest_manuals.py`'s path setup to match the same
`os.path.dirname(os.path.abspath(__file__))`-based pattern already used in the two training
scripts, so all three scripts in `backend/scripts/` behave consistently regardless of cwd.

---

## 19. [MINOR] Loose regex in equipment-ID extraction produces false positives

**What**: `extract_id()` in `backend/app/services/equipment_parser.py` uses
`r"(?i)\b(?=[A-Z0-9-]*\d)[A-Z0-9-]{3,}\b"` — any alphanumeric-with-hyphens token of length ≥3
containing at least one digit. This matches years ("2023"), generic numbers ("100"), or any
incidental code-like text, not just real equipment IDs like `PMP-CW-101`.

**Where**: `backend/app/services/equipment_parser.py`, line 13.

**Why it matters**: A Copilot question like "What changed after 2023?" would have `extract_id`
return `"2023"`, which then gets used as an `equipment_id` filter in
`postgres_service.get_incidents("2023")` etc. — silently returning zero rows rather than
signaling "no equipment ID found," which produces a subtly wrong (empty relational context)
answer instead of a correct one.

**Suggested fix**: Tighten the regex to require the pattern actually seen in the data (letters,
a hyphen, more letters, a hyphen, digits — e.g. `PMP-CW-101`):
```python
match = re.search(r"\b[A-Z]{2,4}-[A-Z]{2,4}-\d{2,4}\b", question, re.IGNORECASE)
```
Validate against the real ID list in `data/equipment.csv` before finalizing the pattern.

---

## 20. [MINOR] Duplicate feature-importance printing in `train_ai4i.py`

**What**: `backend/scripts/train_ai4i.py` prints the sorted feature-importance list twice in a
row (lines ~119–128 and again ~130–133), once sorted descending with one format string, once
unsorted with a slightly different format string. Cosmetic duplication, not a functional bug.

**Where**: `backend/scripts/train_ai4i.py`, lines 119–133.

**Why it matters**: Low severity — just noisy/confusing console output when retraining models.

**Suggested fix**: Delete the second block (lines ~130–133, the "`\n[AI4I] Feature
Importances:`" print loop), keeping only the first sorted version.
