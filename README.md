# 🚀 AssetMind – AI-Powered Industrial Asset Intelligence Platform

<p align="center">
<b>Unified Asset Intelligence • Predictive Maintenance • Knowledge Graph • RAG • AI Copilot</b>
</p>

---

# 📌 Overview

AssetMind is an AI-powered industrial asset intelligence platform that combines operational data, maintenance history, OEM manuals, and generative AI into a single decision-support system.

Instead of engineers searching through thousands of pages of manuals and historical maintenance records, AssetMind provides contextual insights, predictive analytics, and explainable AI recommendations through an interactive copilot.

The platform is designed for manufacturing plants, utilities, refineries, power stations, and industrial facilities where equipment reliability is critical.

---

# 🎯 Problem Statement

Industrial organizations face several challenges:

* Maintenance history is scattered across multiple systems.
* Engineers manually search hundreds of pages of OEM manuals.
* Failures often repeat because previous recommendations were ignored.
* Critical maintenance knowledge remains undocumented.
* Existing CMMS solutions store data but do not provide intelligent reasoning.
* Predictive insights are difficult to obtain without advanced AI systems.

AssetMind addresses these issues by creating a unified operational intelligence platform.

---

# ✨ Features

## 📊 Dashboard

* Asset overview
* Work order statistics
* Incident statistics
* Inspection statistics
* Executive insights
* High-risk assets
* Knowledge gap summary

---

## 🏭 Asset Explorer

Search and browse industrial assets.

Displays:

* Equipment information
* Location
* Manufacturer
* Criticality
* Installation date

---

## 📄 Equipment Profile

Comprehensive equipment dashboard including:

* Health Score
* Failure Risk
* Remaining Useful Life
* Criticality
* Briefing Card
* Recent inspections
* Recent incidents
* Work order history

---

## 📈 Failure Timeline

Interactive timeline displaying:

* Inspections
* Recommendations
* Work Orders
* Incidents
* Repairs

This enables engineers to understand how failures evolved over time.

---

## ⚠ Knowledge Gap Detection

Automatically detects situations where:

Inspection

↓

Recommendation issued

↓

No maintenance performed

↓

Failure occurred later

These are highlighted as **Potentially Preventable Failures**.

---

## 🤖 AssetMind Copilot

AI-powered industrial assistant capable of answering questions like:

> Why is PMP-CW-101 failing?

> What causes cavitation?

> Recommend maintenance actions.

The Copilot combines:

* PostgreSQL asset history
* Inspection reports
* Work orders
* Incident reports
* OEM manuals
* Standard Operating Procedures
* Retrieval-Augmented Generation (RAG)

---

## 📚 Manual Search (RAG)

Supports semantic search across:

* Grundfos Manuals
* Siemens Manuals
* ABB Manuals
* Atlas Copco Manuals
* SOP Documents

Returns:

* Relevant manual excerpts
* Page citations
* AI-generated explanations

---

## 🔮 Failure Prediction

Uses the AI4I Predictive Maintenance Dataset.

Predicts:

* Failure probability
* Risk category
* Important contributing features

---

## ⏳ Remaining Useful Life (RUL)

Uses NASA CMAPSS dataset.

Predicts:

* Remaining useful life
* Equipment degradation trend
* Asset health score

---

# 🏗 System Architecture

```
                         +--------------------+
                         |   React Frontend   |
                         +---------+----------+
                                   |
                              REST APIs
                                   |
                         +---------v----------+
                         |   FastAPI Backend  |
                         +---------+----------+
                                   |
          ---------------------------------------------------
          |             |              |          |          |
          |             |              |          |          |
     PostgreSQL     ChromaDB     AI Models   Knowledge  Copilot
                                   |           Graph
                                   |
                    -----------------------------------
                    |                |                |
                 AI4I Model      CMAPSS Model     Sarvam AI
```

---

# 🛠 Technology Stack

## Frontend

* React.js
* Tailwind CSS
* Axios
* React Router

---

## Backend

* FastAPI
* SQLAlchemy
* Pydantic
* Python

---

## Database

* PostgreSQL

Stores:

* Equipment
* Work Orders
* Inspection Reports
* Incident Reports

---

## Vector Database

* ChromaDB

Stores:

* Manual chunks
* Embeddings

---

## AI Models

* Sarvam AI (Industrial Copilot)
* Sentence Transformers (Embeddings)
* Random Forest (Failure Prediction)
* XGBoost (Remaining Useful Life)

---

## Machine Learning

* Scikit-learn
* Pandas
* NumPy

---

# 📂 Project Structure

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

# 📡 API Endpoints

## Equipment

```
GET /equipment

GET /equipment/{id}

GET /equipment/{id}/briefing

GET /equipment/{id}/timeline

GET /equipment/{id}/incidents

GET /equipment/{id}/inspections

GET /equipment/{id}/health
```

---

## Dashboard

```
GET /dashboard

GET /dashboard/high-risk-assets
```

---

## Insights

```
GET /insights/executive

GET /insights/knowledge-gaps

GET /insights/knowledge-gaps/summary
```

---

## AI Prediction

```
POST /predict/failure

POST /predict/rul
```

---

## Copilot

```
POST /ask/

POST /ask/copilot
```

---

# 🧠 How AssetMind Works

```
User Query

↓

Equipment Detection

↓

Retrieve Maintenance History

↓

Retrieve Inspection Reports

↓

Retrieve Incident Reports

↓

Retrieve OEM Manual Chunks

↓

Combine Evidence

↓

LLM Reasoning

↓

Explainable AI Response
```

---

# 📖 Retrieval-Augmented Generation Pipeline

```
PDF Manuals

↓

Chunking

↓

Sentence Embeddings

↓

ChromaDB

↓

Semantic Search

↓

Context Retrieval

↓

Sarvam AI

↓

Answer with Citations
```

---

# 📈 Failure Prediction Pipeline

```
Sensor Data

↓

Preprocessing

↓

Random Forest Model

↓

Failure Probability

↓

Risk Classification
```

---

# 📉 Remaining Useful Life Pipeline

```
Sensor Sequence

↓

CMAPSS Dataset

↓

XGBoost Model

↓

Remaining Useful Life

↓

Health Score
```

---

# 🎬 Demo Flow

1. Open Dashboard
2. Review Executive Insights
3. Select High-Risk Asset
4. Open Equipment Profile
5. Analyze Failure Timeline
6. View Knowledge Gap Detection
7. Ask AssetMind Copilot
8. Review AI Prediction
9. Check Remaining Useful Life
10. Receive Maintenance Recommendation

---

# 🌟 Key Highlights

* Unified Asset Intelligence Platform
* AI-Powered Industrial Copilot
* Retrieval-Augmented Generation (RAG)
* Knowledge Gap Detection
* Predictive Maintenance
* Remaining Useful Life Estimation
* Explainable AI Recommendations
* Semantic Manual Search
* Interactive Failure Timeline
* Executive Decision Dashboard

---

# 🚀 Future Enhancements

* Real-time IoT integration
* Digital Twin visualization
* Multi-agent maintenance workflows
* Predictive scheduling
* SAP PM integration
* MQTT support
* OPC-UA connectivity
* Automatic work-order generation
* Mobile application
* Voice-enabled AI assistant

---

# 👨‍💻 Team

Developed as part of an Industrial AI Hackathon to demonstrate how Generative AI, Machine Learning, and Knowledge Retrieval can transform industrial asset management into an intelligent, explainable, and predictive maintenance platform.

---

# 📄 License

This project is intended for educational, research, and hackathon purposes.

---

<p align="center">
<b>AssetMind</b><br>
AI for Smarter Industrial Maintenance 🚀
</p>
