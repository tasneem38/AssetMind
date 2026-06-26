"""
scripts/train_cmapss.py

Train an XGBoost Regressor on the NASA CMAPSS FD001 dataset to predict
Remaining Useful Life (RUL).

Saves:
    backend/models/cmapss_model.pkl
    backend/models/cmapss_scaler.pkl

Run from the backend/ directory:
    python -m scripts.train_cmapss
or:
    python scripts/train_cmapss.py
"""

import os
import sys
import pickle
import numpy as np
import pandas as pd

from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_absolute_error, mean_squared_error

try:
    from xgboost import XGBRegressor
except ImportError:
    print("ERROR: xgboost not installed. Run: pip install xgboost")
    sys.exit(1)

# ── Path setup ───────────────────────────────────────────────────────────────
_SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
_BACKEND_DIR = os.path.dirname(_SCRIPT_DIR)
_CMAPSS_DIR = os.path.join(
    os.path.dirname(_BACKEND_DIR), "data", "cmapss"
)
_MODELS_DIR = os.path.join(_BACKEND_DIR, "models")
os.makedirs(_MODELS_DIR, exist_ok=True)

# ── CMAPSS column schema ─────────────────────────────────────────────────────
# FD001 has 26 columns: id, cycle, 3 operational settings, 21 sensors
_ALL_COLS = (
    ["id", "cycle", "op1", "op2", "op3"]
    + [f"s{i}" for i in range(1, 22)]
)

# Sensors that carry useful signal for FD001 (drop near-constant sensors)
SENSOR_COLS = [
    "s2", "s3", "s4", "s7", "s8",
    "s9", "s11", "s12", "s13", "s14",
    "s15", "s17", "s20", "s21",
]

MAX_RUL = 130  # clip RUL at 130 cycles (piecewise-linear target)


def load_dataset(filename: str) -> pd.DataFrame:
    path = os.path.join(_CMAPSS_DIR, filename)
    if not os.path.exists(path):
        print(f"ERROR: File not found: {path}")
        sys.exit(1)
    df = pd.read_csv(path, sep=r"\s+", header=None, names=_ALL_COLS)
    return df


def add_rul(df: pd.DataFrame) -> pd.DataFrame:
    """Add RUL column (piecewise-linear, clipped at MAX_RUL)."""
    max_cycles = df.groupby("id")["cycle"].max().reset_index()
    max_cycles.columns = ["id", "max_cycle"]
    df = df.merge(max_cycles, on="id")
    df["RUL"] = df["max_cycle"] - df["cycle"]
    df["RUL"] = df["RUL"].clip(upper=MAX_RUL)
    df.drop(columns=["max_cycle"], inplace=True)
    return df


def add_rul_test(
    df_test: pd.DataFrame,
    rul_path: str,
) -> pd.DataFrame:
    """Assign true RUL to test set from the RUL_FD00x.txt ground-truth file."""
    if not os.path.exists(rul_path):
        print(f"ERROR: RUL file not found: {rul_path}")
        sys.exit(1)
    true_rul = pd.read_csv(rul_path, header=None, names=["RUL"])
    # Last cycle of each engine
    last_cycles = (
        df_test.groupby("id")["cycle"].max().reset_index()
    )
    last_cycles["RUL"] = true_rul["RUL"].values
    last_cycles["RUL"] = last_cycles["RUL"].clip(upper=MAX_RUL)
    # Merge back
    df_test = df_test.merge(
        last_cycles[["id", "RUL"]], on="id", how="left"
    )
    # For non-last cycles, compute offset from last-cycle RUL
    max_cycles = df_test.groupby("id")["cycle"].max().reset_index()
    max_cycles.columns = ["id", "max_cycle"]
    df_test = df_test.merge(max_cycles, on="id")
    df_test["RUL"] = df_test["RUL"] + (df_test["max_cycle"] - df_test["cycle"])
    df_test["RUL"] = df_test["RUL"].clip(upper=MAX_RUL)
    df_test.drop(columns=["max_cycle"], inplace=True)
    return df_test


def main():
    print(f"[CMAPSS] Using FD001 dataset from: {_CMAPSS_DIR}")

    # ── Load training data ────────────────────────────────────────────────
    df_train = load_dataset("train_FD001.txt")
    df_train = add_rul(df_train)
    print(f"[CMAPSS] Training set shape: {df_train.shape}")

    X_train = df_train[SENSOR_COLS].values
    y_train = df_train["RUL"].values

    # ── Load test data ────────────────────────────────────────────────────
    df_test = load_dataset("test_FD001.txt")
    rul_path = os.path.join(_CMAPSS_DIR, "RUL_FD001.txt")
    df_test = add_rul_test(df_test, rul_path)
    X_test = df_test[SENSOR_COLS].values
    y_test = df_test["RUL"].values
    print(f"[CMAPSS] Test set shape: {df_test.shape}")

    # ── Scale ─────────────────────────────────────────────────────────────
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # ── Train XGBoost Regressor ───────────────────────────────────────────
    print("[CMAPSS] Training XGBoost Regressor ...")
    model = XGBRegressor(
        n_estimators=300,
        max_depth=6,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        random_state=42,
        n_jobs=-1,
        verbosity=0,
    )
    model.fit(
        X_train_scaled,
        y_train,
        eval_set=[(X_test_scaled, y_test)],
        verbose=50,
    )

    # ── Evaluate ──────────────────────────────────────────────────────────
    y_pred = model.predict(X_test_scaled)
    mae = mean_absolute_error(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))

    print(f"\n[CMAPSS] ── Evaluation ──")
    print(f"MAE  : {mae:.2f} cycles")
    print(f"RMSE : {rmse:.2f} cycles")

    # ── Save artefacts ────────────────────────────────────────────────────
    model_path = os.path.join(_MODELS_DIR, "cmapss_model.pkl")
    scaler_path = os.path.join(_MODELS_DIR, "cmapss_scaler.pkl")

    with open(model_path, "wb") as f:
        pickle.dump(model, f)
    with open(scaler_path, "wb") as f:
        pickle.dump(scaler, f)

    print(f"\n[CMAPSS] Model saved  → {model_path}")
    print(f"[CMAPSS] Scaler saved → {scaler_path}")
    print("[CMAPSS] Training complete ✓")


if __name__ == "__main__":
    main()
