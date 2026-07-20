<div align="center">

# ⚙️ AssetMind
### AI-Powered Industrial Asset Intelligence Platform

[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat-square&logo=python)](https://python.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=flat-square&logo=postgresql)](https://postgresql.org/)
[![ChromaDB](https://img.shields.io/badge/ChromaDB-RAG-FF6B35?style=flat-square)](https://www.trychroma.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

**Predict failures before they happen. Query manuals in plain English. Manage every asset from one dashboard.**

[Demo](#-demo) · [Features](#-features) · [Architecture](#-architecture) · [Quick Start](#-quick-start) · [Results](#-results) · [Team](#-team)

</div>

---

## 📌 The Problem

Unplanned industrial downtime costs billions annually — most teams still run **reactive** maintenance, fixing equipment only after it fails. AssetMind flips this to **proactive, data-driven** maintenance: predicting failures weeks ahead, and putting OEM manual knowledge one question away.

## 🎬 Demo

📺 [**Watch the 2-min demo**](https://drive.google.com/file/d/12xCjl5IYJQappaqQTGw94S46n1AdPLZ5/view?usp=sharing)

## ✨ Features

| | |
|---|---|
| 🔮 **Failure Prediction** | RandomForest + XGBoost models forecast failure probability & Remaining Useful Life |
| 📚 **RAG Copilot** | Ask natural-language questions across 9 OEM manuals, answered with source citations |
| 🗂️ **Asset Registry** | Unified view of 25 industrial assets with live health scores |
| 📋 **Work Orders & Incidents** | Track, prioritize, and root-cause maintenance events |
| 🕳️ **Knowledge Gap Detection** | Flags where documentation coverage is missing |
| 📊 **Live Dashboard** | Real-time KPIs, health scores, failure timelines |

## 🏗️ Architecture

```
React 19 (Dashboard · Asset Explorer · Copilot Chat)
              │  REST / HTTP
              ▼
     FastAPI  (/predict  /ask  /equipment  /dashboard  /insights)
       │                        │
       ▼                        ▼
 ┌──────────────┐      ┌────────────────────────────┐
 │  PostgreSQL  │      │   ML Engine + RAG Pipeline  │
 │  Assets ·    │      │  RandomForest (failure) +   │
 │  WorkOrders ·│      │  XGBoost (RUL) · ChromaDB   │
 │  Incidents   │      │  over 9 OEM manual PDFs     │
 └──────────────┘      └────────────────────────────┘
```

**Flow:** sensor/operational features → RandomForest (failure probability) + XGBoost (RUL in cycles) → asset health score & alerts. User queries → embedded → matched against ChromaDB manual chunks → grounded LLM answer with citations + knowledge-gap flag.

## 📊 Results

| Model | Task | Key Metric |
|---|---|---|
| RandomForest | Failure classification | **96.4% accuracy**, 0.973 ROC-AUC, 79.4% recall |
| XGBoost | RUL regression | **13.28 cycles MAE**, 18.40 RMSE |

Top drivers of failure risk: **torque, rotational speed, tool wear.**
*(Trained on a synthetic dataset covering 25 assets × 2 years of operational data.)*

## 🛠️ Tech Stack

**Frontend:** React 19 · Vite · Tailwind · Recharts
**Backend:** FastAPI · SQLAlchemy · PostgreSQL 16
**AI/ML:** scikit-learn · XGBoost · ChromaDB (RAG) · PyMuPDF

## 🚀 Quick Start

```bash
git clone https://github.com/tasneem38/AssetMind.git && cd AssetMind

# Backend
cd backend && python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # set DATABASE_URL, CHROMA_PERSIST_DIR, SECRET_KEY
python scripts/seed_data.py
python scripts/ingest_manuals.py
python scripts/train_ai4i.py && python scripts/train_cmapss.py
uvicorn app.main:app --reload --port 8000   # → localhost:8000/docs

# Frontend (new terminal)
cd frontend && npm install
cp .env.example .env.local   # VITE_API_URL=http://localhost:8000
npm run dev   # → localhost:5173
```

> ⚠️ **Local proof-of-concept only** — no auth on backend endpoints. Don't expose publicly without adding authentication.

## 📡 Core API

| Endpoint | Purpose |
|---|---|
| `POST /predict/failure` | Failure probability (RandomForest) |
| `POST /predict/rul` | Remaining Useful Life (XGBoost) |
| `POST /ask/copilot` | Natural-language Q&A (RAG + relational data) |
| `GET /dashboard/` | Aggregate KPIs |
| `GET /insights/knowledge-gaps` | Documentation gap detection |

Full interactive docs at `/docs` (Swagger UI) once running.

## 🗺️ What's Next

Real-time WebSocket alerts · IoT/MQTT sensor ingestion · model drift detection & auto-retrain · PDF/Excel report export.

## 👥 Team — CREW 1.0

| Name | Role | GitHub |
|---|---|---|
| Tasneem Banu | Full-Stack Dev & AI/ML | [@tasneem38](https://github.com/tasneem38) |
| KS Bande Nawaz Ahamed | Backend & Data Architecture | [@nawazks72](https://github.com/nawazks72) |

---

<div align="center">

Built for smart industrial operations · [Portfolio](https://tasneem-banu.netlify.app/) · [LinkedIn](https://linkedin.com/in/tasneem-banu38) · MIT License

</div>