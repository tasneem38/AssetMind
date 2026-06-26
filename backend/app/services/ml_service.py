"""
ml_service.py – Loads trained ML models at import time and exposes
prediction helpers for the /predict routes.

Models are stored under:
    backend/models/
        ai4i_model.pkl     – RandomForest failure classifier
        ai4i_scaler.pkl    – StandardScaler for AI4I features
        cmapss_model.pkl   – XGBoost RUL regressor
        cmapss_scaler.pkl  – StandardScaler for CMAPSS sensor features
"""

import os
import pickle
import numpy as np

# ── Path resolution ─────────────────────────────────────────────────────────
_HERE = os.path.dirname(os.path.abspath(__file__))
# services/ → app/ → backend/
_BACKEND_DIR = os.path.dirname(os.path.dirname(_HERE))
_MODELS_DIR = os.path.join(_BACKEND_DIR, "models")

# ── AI4I feature names (same order as training) ─────────────────────────────
AI4I_FEATURE_NAMES = [
    "Air temperature [K]",
    "Process temperature [K]",
    "Rotational speed [rpm]",
    "Torque [Nm]",
    "Tool wear [min]",
]

AI4I_DISPLAY_NAMES = [
    "Air Temperature",
    "Process Temperature",
    "Rotational Speed",
    "Torque",
    "Tool Wear",
]

# ── CMAPSS sensor column names (14 selected sensors from FD001) ─────────────
CMAPSS_SENSOR_NAMES = [
    "s2", "s3", "s4", "s7", "s8",
    "s9", "s11", "s12", "s13", "s14",
    "s15", "s17", "s20", "s21",
]


# ── Lazy model loading ───────────────────────────────────────────────────────

_ai4i_model = None
_ai4i_scaler = None
_cmapss_model = None
_cmapss_scaler = None


def _load_ai4i():
    global _ai4i_model, _ai4i_scaler
    if _ai4i_model is None:
        model_path = os.path.join(_MODELS_DIR, "ai4i_model.pkl")
        scaler_path = os.path.join(_MODELS_DIR, "ai4i_scaler.pkl")
        if not os.path.exists(model_path):
            raise FileNotFoundError(
                f"AI4I model not found at {model_path}. "
                "Run scripts/train_ai4i.py first."
            )
        with open(model_path, "rb") as f:
            _ai4i_model = pickle.load(f)
        with open(scaler_path, "rb") as f:
            _ai4i_scaler = pickle.load(f)
    return _ai4i_model, _ai4i_scaler


def _load_cmapss():
    global _cmapss_model, _cmapss_scaler
    if _cmapss_model is None:
        model_path = os.path.join(_MODELS_DIR, "cmapss_model.pkl")
        scaler_path = os.path.join(_MODELS_DIR, "cmapss_scaler.pkl")
        if not os.path.exists(model_path):
            raise FileNotFoundError(
                f"CMAPSS model not found at {model_path}. "
                "Run scripts/train_cmapss.py first."
            )
        with open(model_path, "rb") as f:
            _cmapss_model = pickle.load(f)
        with open(scaler_path, "rb") as f:
            _cmapss_scaler = pickle.load(f)
    return _cmapss_model, _cmapss_scaler


# ── AI4I Failure Prediction ──────────────────────────────────────────────────

def predict_failure(
    air_temperature: float,
    process_temperature: float,
    rotational_speed: float,
    torque: float,
    tool_wear: float,
) -> dict:
    """
    Returns failure probability, risk level, and top 3 feature importances.
    """
    model, scaler = _load_ai4i()

    features = np.array([[
        air_temperature,
        process_temperature,
        rotational_speed,
        torque,
        tool_wear,
    ]])

    features_scaled = scaler.transform(features)
    failure_prob = float(model.predict_proba(features_scaled)[0][1])

    if failure_prob >= 0.7:
        risk_level = "High"
    elif failure_prob >= 0.4:
        risk_level = "Medium"
    else:
        risk_level = "Low"

    # Top 3 features by importance
    importances = model.feature_importances_
    ranked_indices = np.argsort(importances)[::-1][:3]
    top_features = [AI4I_DISPLAY_NAMES[i] for i in ranked_indices]

    return {
        "failure_probability": round(failure_prob, 4),
        "risk_level": risk_level,
        "top_features": top_features,
    }


# ── CMAPSS RUL Prediction ────────────────────────────────────────────────────

def predict_rul(sensor_values: list) -> dict:
    """
    Expects a list of 14 sensor values in CMAPSS_SENSOR_NAMES order.
    Returns health_score, remaining_useful_life, and degradation_trend.
    """
    model, scaler = _load_cmapss()

    if len(sensor_values) != 14:
        raise ValueError(
            f"Expected 14 sensor values, got {len(sensor_values)}. "
            f"Order: {CMAPSS_SENSOR_NAMES}"
        )

    features = np.array([sensor_values], dtype=float)
    features_scaled = scaler.transform(features)
    rul_pred = float(model.predict(features_scaled)[0])
    rul_pred = max(0.0, rul_pred)

    # Map RUL → health_score (0–400 cycles → 0–100 score)
    max_rul = 400.0
    health_score = round(min((rul_pred / max_rul) * 100, 100))

    if rul_pred < 100:
        degradation_trend = "Critical"
    elif rul_pred < 200:
        degradation_trend = "Declining"
    elif rul_pred < 300:
        degradation_trend = "Stable"
    else:
        degradation_trend = "Healthy"

    return {
        "health_score": health_score,
        "remaining_useful_life": round(rul_pred),
        "degradation_trend": degradation_trend,
    }
