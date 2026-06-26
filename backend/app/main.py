from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.equipment import router as equipment_router
from app.routes.rag import router as rag_router
from app.routes.insights import router as insights_router
from app.routes.dashboard import router as dashboard_router
from app.routes.predict import router as predict_router

app = FastAPI(
    title="AssetMind API",
    description="Industrial Asset Intelligence Platform",
    version="2.0.0",
)

# ── CORS ─────────────────────────────────────────────────────────────────────
# Allow the Vite dev server (and any localhost port) to call the API.
# Tighten origins list before deploying to production.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(equipment_router)
app.include_router(rag_router)
app.include_router(insights_router)
app.include_router(dashboard_router)
app.include_router(predict_router)


@app.get("/")
def home():
    return {
        "message": "AssetMind Backend Running",
        "version": "2.0.0",
    }