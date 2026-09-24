import pytest
import numpy as np
from services.ml.error.mechanisms.types import ErrorMechanism
from services.ml.error.mechanisms.baseline import BaselineMechanismModel
from services.ml.error.features.proxies import (
    calculate_spatial_displacement_proxy,
    calculate_orographic_proxy
)

def test_spatial_displacement_proxy():
    # Local is 0, but neighborhood has 50. High variance -> likely spatial displacement.
    score = calculate_spatial_displacement_proxy(0.0, np.array([0, 0, 50, 10, 0]), variance_threshold=10.0)
    assert score > 0.9 # Very close to 1.0
    
    # Local is 20, neighborhood max is 22. Low variance -> unlikely spatial displacement.
    score2 = calculate_spatial_displacement_proxy(20.0, np.array([18, 19, 22, 20]), variance_threshold=10.0)
    assert score2 < 0.5 # Should be low

def test_orographic_proxy():
    # High elevation gradient and high rain -> likely orographic error.
    score = calculate_orographic_proxy(50.0, elevation_gradient=100.0)
    assert score > 0.9
    
    # Low rain -> no orographic error
    score2 = calculate_orographic_proxy(0.0, elevation_gradient=100.0)
    assert score2 == 0.0

def test_baseline_mechanism_model():
    model = BaselineMechanismModel()
    
    # Simulate a scenario near a coast with high cape and a spatial mismatch
    probs = model.predict(
        nwp_local=20.0,
        nwp_neighborhood=np.array([5, 10, 80, 20]), # Neighborhood max 80 -> spatial displacement
        nwp_t_minus_1=18.0,
        nwp_t_plus_1=22.0, # Slow change -> temporal timing low
        climatology_p90=50.0, # Not extreme compared to climatology
        elevation_gradient=5.0, # Flat
        distance_to_coast_km=5.0, # Very close to coast
        cape=2000.0, # High CAPE -> convective
        wind_speed=5.0
    )
    
    assert probs.probabilities[ErrorMechanism.SPATIAL_DISPLACEMENT] > 0.9
    assert probs.probabilities[ErrorMechanism.COASTAL] > 0.9
    assert probs.probabilities[ErrorMechanism.CONVECTIVE] > 0.8
    assert probs.probabilities[ErrorMechanism.OROGRAPHIC] < 0.1
    assert probs.probabilities[ErrorMechanism.TEMPORAL_TIMING] < 0.5
    
    # Residual should be low because other proxies are high
    assert probs.probabilities[ErrorMechanism.PHYSICS_RESIDUAL] < 0.1
    
    dominant = probs.get_dominant_mechanisms(threshold=0.8)
    assert ErrorMechanism.SPATIAL_DISPLACEMENT in dominant
    assert ErrorMechanism.COASTAL in dominant
    assert ErrorMechanism.CONVECTIVE in dominant
    assert ErrorMechanism.OROGRAPHIC not in dominant
