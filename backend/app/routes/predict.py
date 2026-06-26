"""
routes/predict.py

POST /predict/failure  – AI4I Random Forest failure probability
POST /predict/rul      – CMAPSS XGBoost remaining useful life
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List

from ..services import ml_service

router = APIRouter(
    prefix="/predict",
    tags=["Prediction"],
)


# ── Request / Response schemas ───────────────────────────────────────────────

class FailureInput(BaseModel):
    air_temperature: float = Field(
        ..., example=298.0, description="Air temperature in Kelvin"
    )
    process_temperature: float = Field(
        ..., example=308.0, description="Process temperature in Kelvin"
    )
    rotational_speed: float = Field(
        ..., example=1400.0, description="Rotational speed in RPM"
    )
    torque: float = Field(
        ..., example=45.0, description="Torque in Nm"
    )
    tool_wear: float = Field(
        ..., example=120.0, description="Tool wear in minutes"
    )


class FailureOutput(BaseModel):
    failure_probability: float
    risk_level: str
    top_features: List[str]


class RULInput(BaseModel):
    engine_id: int = Field(
        ..., example=12, description="Engine ID (informational, not used in prediction)"
    )
    sensor_values: List[float] = Field(
        ...,
        description=(
            "14 sensor readings in order: "
            "s2, s3, s4, s7, s8, s9, s11, s12, s13, s14, s15, s17, s20, s21"
        ),
        min_length=14,
        max_length=14,
    )


class RULOutput(BaseModel):
    health_score: int
    remaining_useful_life: int
    degradation_trend: str


# ── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/failure", response_model=FailureOutput)
def predict_failure(body: FailureInput):
    """
    Predict failure probability using a trained Random Forest on the AI4I dataset.

    Input:
        air_temperature, process_temperature, rotational_speed, torque, tool_wear

    Output:
        failure_probability  – 0.0 to 1.0
        risk_level           – Low / Medium / High
        top_features         – Top 3 by feature_importances_
    """
    try:
        result = ml_service.predict_failure(
            air_temperature=body.air_temperature,
            process_temperature=body.process_temperature,
            rotational_speed=body.rotational_speed,
            torque=body.torque,
            tool_wear=body.tool_wear,
        )
        return result
    except FileNotFoundError as exc:
        raise HTTPException(
            status_code=503,
            detail=f"Model not ready: {exc}",
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/rul", response_model=RULOutput)
def predict_rul(body: RULInput):
    """
    Predict Remaining Useful Life using XGBoost trained on NASA CMAPSS FD001.

    Input:
        engine_id     – Engine identifier (informational)
        sensor_values – 14 sensor readings

    Output:
        health_score            – 0 to 100
        remaining_useful_life   – Predicted cycles remaining
        degradation_trend       – Healthy / Stable / Declining / Critical
    """
    try:
        result = ml_service.predict_rul(body.sensor_values)
        return result
    except FileNotFoundError as exc:
        raise HTTPException(
            status_code=503,
            detail=f"Model not ready: {exc}",
        )
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
