<div align="center">

# ⚙️ AssetMind

### AI-Powered Industrial Asset Intelligence Platform

[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat-square&logo=python)](https://python.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=flat-square&logo=postgresql)](https://postgresql.org/)
[![ChromaDB](https://img.shields.io/badge/ChromaDB-RAG-FF6B35?style=flat-square)](https://www.trychroma.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

> Predict failures before they happen. Query manuals with natural language. Unify your industrial asset data in one intelligent platform.

[Features](#-features) · [Architecture](#-architecture) · [Getting Started](#-getting-started) · [API Docs](#-api-reference) · [ML Models](#-ml-models) · [Contributing](#-contributing)

</div>

---

## 📌 Overview

**AssetMind** is a full-stack AI platform for industrial asset management that combines **predictive maintenance ML models**, a **Retrieval-Augmented Generation (RAG) pipeline** over OEM manuals, and a **real-time operational dashboard** — all in one unified interface.

Industrial operations lose billions annually to unplanned downtime. AssetMind shifts teams from reactive maintenance to **proactive, data-driven asset intelligence**, enabling engineers to:

- Predict equipment failures weeks in advance
- Query OEM manuals and maintenance history using natural language
- Monitor 25+ assets across failure modes, work orders, and incidents in real time
- Detect knowledge gaps across maintenance documentation

---
## 🎬 Demo

🔗 **Watch the Demo:**  
https://drive.google.com/file/d/12xCjl5IYJQappaqQTGw94S46n1AdPLZ5/view?usp=sharing

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔮 **Predictive Maintenance** | RandomForest + XGBoost models predict failure probability per asset |
| 📚 **RAG over OEM Manuals** | ChromaDB-backed semantic search across 9 OEM PDFs |
| 🗂️ **Asset Registry** | Unified view of 25 industrial assets with full metadata |
| 📋 **Work Order Intelligence** | Track, prioritize, and analyze maintenance work orders |
| 🔍 **Inspection Reports** | Structured inspection data with anomaly flagging |
| ⚠️ **Incident Management** | Root cause tracking and incident pattern analysis |
| 🕳️ **Knowledge Gap Detection** | Identifies missing documentation coverage across assets |
| 📊 **Live Dashboard** | Real-time KPIs, asset health scores, and failure timelines |

---

## 🏗️ Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                         │
│              React 19 + Vite  (Teal Light Theme)            │
│         Dashboard │ Asset Registry │ Chat Interface         │
└────────────────────────┬────────────────────────────────────┘
                         │ REST / HTTP
┌────────────────────────▼────────────────────────────────────┐
│                       API LAYER                             │
│                   FastAPI (Python)                          │
│     /assets  /workorders  /inspect  /predict  /query        │
└──────┬──────────────┬───────────────┬───────────────────────┘
       │              │               │
┌──────▼──────┐ ┌─────▼──────┐ ┌─────▼──────────────────────┐
│  PostgreSQL  │ │  ML Engine │ │       RAG Pipeline          │
│  (Relational │ │  sklearn   │ │  ChromaDB + OEM PDFs (x9)  │
│   Store)     │ │  XGBoost   │ │  Embedding → Retrieval →   │
│  Assets      │ │  RandomFor.│ │  LLM Response Generation   │
│  WorkOrders  │ │  Failure   │ │                            │
│  Incidents   │ │  Prediction│ │  Knowledge Gap Detection   │
│  Inspections │ └────────────┘ └────────────────────────────┘
└─────────────┘
```

### Data Flow — Predictive Maintenance

```
Sensor/Operational Data
        │
        ▼
  Feature Engineering
  (age, downtime hrs,
   MTBF, fault codes)
        │
        ▼
  ┌─────────────┐     ┌──────────────┐
  │ RandomForest│     │   XGBoost    │
  │  Classifier │     │  Regressor   │
  └──────┬──────┘     └──────┬───────┘
         │                   │
         └────────┬──────────┘
                  ▼
         Ensemble Prediction
         (Failure Probability
          + RUL Estimation)
                  │
                  ▼
         Asset Health Score
         + Alert Generation
```

### RAG Pipeline

```
OEM Manuals (9 PDFs)
        │
        ▼
   Text Chunking
   & Preprocessing
        │
        ▼
  Embedding Model
        │
        ▼
   ChromaDB Vector
      Store
        │
   User Query ──► Query Embedding
        │               │
        └───────────────┘
                │
          Semantic Search
          (Top-K Chunks)
                │
                ▼
         LLM Generation
         (Context-Grounded
            Response)
                │
                ▼
      Answer + Source Citations
      + Knowledge Gap Flag
```

---

## 🗃️ Data Schema

AssetMind manages synthetic industrial data across **25 assets** and **5 core entities**:

```
assets
├── asset_id (PK)
├── name, type, location
├── installation_date
├── manufacturer, model
├── health_score (0–100)
└── status [active | warning | critical | offline]

work_orders
├── wo_id (PK)
├── asset_id (FK → assets)
├── type [preventive | corrective | emergency]
├── priority [low | medium | high | critical]
├── status, assigned_to
└── scheduled_date, completed_date

inspection_reports
├── inspection_id (PK)
├── asset_id (FK)
├── inspector, date
├── findings (JSONB)
└── anomaly_flags []

incident_reports
├── incident_id (PK)
├── asset_id (FK)
├── severity, category
├── root_cause
└── downtime_hours, resolution

ml_predictions
├── prediction_id (PK)
├── asset_id (FK)
├── model_version
├── failure_probability (0.0–1.0)
├── rul_days (Remaining Useful Life)
└── predicted_at (timestamp)
```

---

## 🛠️ Tech Stack

### Frontend
| Layer | Technology |
|---|---|
| Framework | React 19 + Vite |
| Styling | Tailwind CSS (Teal Light Theme) |
| Charts | Recharts |
| State | React Context + useReducer |
| HTTP Client | Axios |

### Backend
| Layer | Technology |
|---|---|
| API Framework | FastAPI |
| ORM | SQLAlchemy |
| Database | PostgreSQL 16 |
| Vector Store | ChromaDB |
| ML | scikit-learn, XGBoost |
| PDF Processing | PyMuPDF / pdfplumber |

---

## 🚀 Getting Started

### Prerequisites

- Python 3.11+
- Node.js 20+
- PostgreSQL 16
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/tasneem38/AssetMind.git
cd AssetMind
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your DB credentials and API keys
```

**.env example:**
```env
DATABASE_URL=postgresql://user:password@localhost:5432/assetmind
CHROMA_PERSIST_DIR=./chroma_store
OEM_MANUALS_DIR=./data/manuals
SECRET_KEY=your-secret-key
```

```bash
# Run database migrations
alembic upgrade head

# Seed synthetic dataset (25 assets + related records)
python scripts/seed_data.py

# Ingest OEM manuals into ChromaDB
python scripts/ingest_manuals.py

# Train ML models
python scripts/train_models.py

# Start the API server
uvicorn app.main:app --reload --port 8000
```

API docs available at: `http://localhost:8000/docs`

### 3. Frontend Setup

```bash
cd frontend

npm install
cp .env.example .env.local
# Set VITE_API_URL=http://localhost:8000

npm run dev
```

App available at: `http://localhost:5173`

---

## 📡 API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/assets` | List all assets with health scores |
| `GET` | `/api/assets/{id}` | Asset detail with full history |
| `GET` | `/api/assets/{id}/predict` | Run failure prediction for asset |
| `GET` | `/api/workorders` | List work orders (filterable) |
| `POST` | `/api/workorders` | Create new work order |
| `GET` | `/api/inspections` | List inspection reports |
| `POST` | `/api/inspections` | Submit inspection report |
| `GET` | `/api/incidents` | List incident reports |
| `POST` | `/api/query` | Natural language query over OEM RAG |
| `GET` | `/api/dashboard/kpis` | Aggregate KPIs for dashboard |
| `GET` | `/api/knowledge-gaps` | Get detected knowledge gaps |

Full interactive docs: `http://localhost:8000/docs` (Swagger UI)

---

## 🤖 ML Models

### Failure Prediction

AssetMind uses two machine learning models to provide predictive maintenance insights.

**RandomForestClassifier** — Binary Failure Prediction
- Features:
  - Air Temperature
  - Process Temperature
  - Rotational Speed
  - Torque
  - Tool Wear
- Output:
  - Failure Probability (0.0–1.0)
  - Risk Level (Low / Medium / High)
  - Top Contributing Features

**XGBoostRegressor** — Remaining Useful Life (RUL) Prediction
- Features:
  - 14 selected CMAPSS engine sensor values
- Output:
  - Remaining Useful Life (RUL)
  - Health Score
  - Degradation Trend

### Model Performance

| Model | Accuracy | Precision | Recall | F1 Score | ROC-AUC | MAE | RMSE | R² |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| **Random Forest** | **96.40%** | **48.21%** | **79.41%** | **0.6000** | **0.9732** | — | — | — |
| **XGBoost (RUL)** | — | — | — | — | — | **13.28 cycles** | **18.40 cycles** | **0.6072** |

### Key Findings

- **Random Forest** achieved **96.40% accuracy** with a **ROC-AUC of 0.9732**, demonstrating excellent discrimination between healthy and failure-prone assets.
- The model prioritizes **high recall (79.41%)**, reducing the likelihood of missing critical equipment failures.
- **Torque**, **Rotational Speed**, and **Tool Wear** were identified as the most influential features for failure prediction.
- The **XGBoost** model predicts Remaining Useful Life with a **Mean Absolute Error of 13.28 cycles** and an **RMSE of 18.40 cycles**, providing actionable maintenance forecasts for industrial assets.

> Models trained on synthetic dataset of 25 assets × 2 years of operational data.

### Re-training

```bash
python scripts/train_models.py --retrain --eval
```

Models are versioned and stored under `backend/models/`.

---

## 📁 Project Structure

```
assetmind/

├── backend/
│
│   ├── app/
│   │
│   ├── routes/
│   │      equipment.py
│   │      dashboard.py
│   │      insights.py
│   │      predict.py
│   │      rag.py
│   │
│   ├── services/
│   │
│   ├── models/
│   │
│   ├── scripts/
│   │
│   ├── manuals/
│   │
│   ├── chroma_db/
│   │
│   └── main.py
│
├── frontend/
│
│   ├── src/
│   │
│   ├── pages/
│   │      Dashboard.jsx
│   │      AssetExplorer.jsx
│   │      EquipmentProfile.jsx
│   │      Timeline.jsx
│   │      Copilot.jsx
│   │      Insights.jsx
│   │
│   ├── components/
│   │
│   └── services/
│
└── README.md
```

---

## 🗺️ Roadmap

- [x] Core asset registry & CRUD
- [x] Synthetic dataset (25 assets, 5 entities)
- [x] FastAPI backend with PostgreSQL
- [x] ChromaDB RAG pipeline over 9 OEM manuals
- [x] RandomForest + XGBoost predictive models
- [x] React 19 dashboard with teal theme
- [x] Knowledge Gap Detection module
- [ ] Real-time WebSocket alerts for critical assets
- [ ] IoT sensor data ingestion (MQTT)
- [ ] Multi-tenant support (plant-level isolation)
- [ ] Mobile-responsive maintenance engineer view
- [ ] Model drift detection & auto-retraining trigger
- [ ] Export reports to PDF / Excel

---

## 👥 Team
Team name - CREW 1.0
| Name | Role | GitHub |
|---|---|---|
| Tasneem Banu | Full-Stack Dev & AI/ML | [@tasneem38](https://github.com/tasneem38) |
| KS Bande Nawaz Ahamed | Backend & Data Architecture | [@nawazks72](https://github.com/nawazks72) |

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

<div align="center">

Built with ❤️ for smart industrial operations · [Portfolio](https://tasneem-banu.netlify.app/) · [LinkedIn](https://linkedin.com/in/tasneem-banu38)

</div>