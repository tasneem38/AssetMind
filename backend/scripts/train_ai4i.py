"""
scripts/train_ai4i.py

Train a Random Forest classifier on the AI4I Predictive Maintenance Dataset.
Saves:
    backend/models/ai4i_model.pkl
    backend/models/ai4i_scaler.pkl

Run from the backend/ directory:
    python -m scripts.train_ai4i
or:
    python scripts/train_ai4i.py
"""

import os
import sys
import pickle
import numpy as np
import pandas as pd

from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    classification_report,
    roc_auc_score,
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
)

# ── Path setup ───────────────────────────────────────────────────────────────
_SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
# scripts/ → backend/
_BACKEND_DIR = os.path.dirname(_SCRIPT_DIR)
_DATA_PATH = os.path.join(
    os.path.dirname(_BACKEND_DIR), "data", "ai4i", "ai4i2020.csv"
)
_MODELS_DIR = os.path.join(_BACKEND_DIR, "models")
os.makedirs(_MODELS_DIR, exist_ok=True)

# ── Feature configuration ────────────────────────────────────────────────────
FEATURE_COLS = [
    "Air temperature [K]",
    "Process temperature [K]",
    "Rotational speed [rpm]",
    "Torque [Nm]",
    "Tool wear [min]",
]
TARGET_COL = "Machine failure"


def main():
    print(f"[AI4I] Loading dataset from: {_DATA_PATH}")
    if not os.path.exists(_DATA_PATH):
        print(f"ERROR: Dataset not found at {_DATA_PATH}")
        sys.exit(1)

    df = pd.read_csv(_DATA_PATH)
    print(f"[AI4I] Dataset shape: {df.shape}")
    print(f"[AI4I] Failure rate: {df[TARGET_COL].mean():.3f}")

    # ── Feature / target split ────────────────────────────────────────────
    X = df[FEATURE_COLS].values
    y = df[TARGET_COL].values

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    # ── Scale features ────────────────────────────────────────────────────
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # ── Train Random Forest ───────────────────────────────────────────────
    print("[AI4I] Training Random Forest ...")
    model = RandomForestClassifier(
        n_estimators=200,
        max_depth=10,
        class_weight="balanced",   # handles class imbalance
        random_state=42,
        n_jobs=-1,
    )
    model.fit(X_train_scaled, y_train)

    # ── Evaluate ──────────────────────────────────────────
    y_pred = model.predict(X_test_scaled)
    y_prob = model.predict_proba(X_test_scaled)[:, 1]

    accuracy = accuracy_score(y_test, y_pred)
    precision = precision_score(y_test, y_pred)
    recall = recall_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred)
    roc_auc = roc_auc_score(y_test, y_prob)

    print("\n" + "=" * 60)
    print("AI4I RANDOM FOREST MODEL PERFORMANCE")
    print("=" * 60)

    print(f"Accuracy : {accuracy:.4f}")
    print(f"Precision: {precision:.4f}")
    print(f"Recall   : {recall:.4f}")
    print(f"F1 Score : {f1:.4f}")
    print(f"ROC-AUC  : {roc_auc:.4f}")

    print("\nClassification Report")
    print(classification_report(
        y_test,
        y_pred,
        target_names=["No Failure", "Failure"]
    ))

    print("Confusion Matrix")
    print(confusion_matrix(y_test, y_pred))

    print("\nFeature Importances")

    importance = sorted(
        zip(FEATURE_COLS, model.feature_importances_),
        key=lambda x: x[1],
        reverse=True,
    )

    for feature, score in importance:
        print(f"{feature:<35} {score:.4f}")
        


    # ── Save artefacts ────────────────────────────────────────────────────
    model_path = os.path.join(_MODELS_DIR, "ai4i_model.pkl")
    scaler_path = os.path.join(_MODELS_DIR, "ai4i_scaler.pkl")

    with open(model_path, "wb") as f:
        pickle.dump(model, f)
    with open(scaler_path, "wb") as f:
        pickle.dump(scaler, f)

    print(f"\n[AI4I] Model saved  → {model_path}")
    print(f"[AI4I] Scaler saved → {scaler_path}")
    print("[AI4I] Training complete ✓")


if __name__ == "__main__":
    main()
