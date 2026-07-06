import pytest
from app.services.ml_service import predict_failure, predict_rul

def test_predict_failure():
    # Example input that matches AI4I typical ranges
    result = predict_failure(
        air_temperature=300.0,
        process_temperature=310.0,
        rotational_speed=1500.0,
        torque=40.0,
        tool_wear=0.0
    )
    assert "risk_level" in result
    assert result["risk_level"] in {"Low", "Medium", "High"}
    assert "failure_probability" in result
    assert 0.0 <= result["failure_probability"] <= 1.0

def test_predict_rul():
    # 14 typical sensor values for CMAPSS
    sensor_values = [
        642.0, 1580.0, 1400.0, 554.0, 2388.0,
        9050.0, 47.0, 521.0, 2388.0, 8130.0,
        8.4, 390.0, 39.0, 23.3
    ]
    result = predict_rul(sensor_values)
    
    assert "health_score" in result
    assert 0 <= result["health_score"] <= 100
    assert "remaining_useful_life" in result
    assert result["remaining_useful_life"] >= 0
    assert "degradation_trend" in result
    assert result["degradation_trend"] in {"Critical", "Declining", "Stable", "Healthy"}

def test_predict_rul_wrong_length():
    with pytest.raises(ValueError, match="Expected 14 sensor values"):
        predict_rul([1.0, 2.0, 3.0])
