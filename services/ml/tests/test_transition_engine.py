import pytest
import numpy as np
from services.ml.regime.transition.engine import TransitionEngine
from services.ml.regime.transition.state import TransitionStateType

def test_stable_regime():
    engine = TransitionEngine(smoothing_alpha=1.0) # no smoothing
    grid_id = "grid_1"
    
    # t=1
    p_t1 = {"Active Monsoon": 0.8, "Break Monsoon": 0.2}
    state = engine.update(grid_id, p_t1)
    
    assert state.state_type == TransitionStateType.STABLE
    assert state.dominant_regime == "Active Monsoon"
    assert state.transition_magnitude == 0.0
    
    # t=2 (small change)
    p_t2 = {"Active Monsoon": 0.75, "Break Monsoon": 0.25}
    state = engine.update(grid_id, p_t2)
    
    assert state.state_type == TransitionStateType.STABLE
    assert state.dominant_regime == "Active Monsoon"
    # D_t = 0.5 * (|0.75 - 0.8| + |0.25 - 0.2|) = 0.5 * (0.05 + 0.05) = 0.05
    assert np.isclose(state.transition_magnitude, 0.05)

def test_transition_magnitude_and_states():
    engine = TransitionEngine(
        smoothing_alpha=1.0, 
        transition_threshold_low=0.15, 
        transition_threshold_high=0.35
    )
    grid_id = "grid_2"
    
    # t=1
    engine.update(grid_id, {"A": 0.9, "B": 0.1})
    
    # t=2 (moderate change: D_t = 0.2)
    state = engine.update(grid_id, {"A": 0.7, "B": 0.3})
    assert state.state_type == TransitionStateType.TRANSITION
    assert state.is_transitioning() is True
    
    # t=3 (rapid change: D_t = 0.4)
    state = engine.update(grid_id, {"A": 0.3, "B": 0.7})
    assert state.state_type == TransitionStateType.RAPID_TRANSITION
    assert state.dominant_regime == "B"
    assert state.transition_direction == "A -> B"

def test_temporal_smoothing():
    engine = TransitionEngine(smoothing_alpha=0.5)
    grid_id = "grid_3"
    
    # t=1
    engine.update(grid_id, {"A": 1.0, "B": 0.0})
    
    # t=2 (spike to B, but smoothing should dampen it)
    # p_t raw is {"A": 0.0, "B": 1.0}
    # With alpha=0.5, p_t = 0.5 * raw + 0.5 * prev = {"A": 0.5, "B": 0.5}
    state = engine.update(grid_id, {"A": 0.0, "B": 1.0})
    
    assert state.current_probs["A"] == 0.5
    assert state.current_probs["B"] == 0.5

def test_hysteresis():
    engine = TransitionEngine(smoothing_alpha=1.0, hysteresis_threshold=0.1)
    grid_id = "grid_4"
    
    engine.update(grid_id, {"A": 0.55, "B": 0.45})
    assert engine.get_memory(grid_id).last_dominant_regime == "A"
    
    # t=2 (B becomes slightly higher, but within hysteresis threshold)
    # diff is 0.52 - 0.48 = 0.04 < 0.1
    state = engine.update(grid_id, {"A": 0.48, "B": 0.52})
    
    assert state.dominant_regime == "A" # should still be A due to hysteresis

    # t=3 (B exceeds hysteresis threshold)
    # diff is 0.6 - 0.4 = 0.2 > 0.1
    state = engine.update(grid_id, {"A": 0.4, "B": 0.6})
    assert state.dominant_regime == "B"

def test_hmm_prior():
    transition_matrix = np.array([
        [0.9, 0.1], # A -> A (0.9), A -> B (0.1)
        [0.2, 0.8]  # B -> A (0.2), B -> B (0.8)
    ])
    engine = TransitionEngine(
        smoothing_alpha=1.0,
        use_hmm=True,
        transition_matrix=transition_matrix,
        regime_names=["A", "B"]
    )
    grid_id = "grid_5"
    
    engine.update(grid_id, {"A": 1.0, "B": 0.0})
    
    # Next step, the HMM expects A to be 0.9 and B to be 0.1.
    # If the raw input is A: 0.5, B: 0.5
    # The fused should be biased towards A.
    # Prior: A=0.9, B=0.1
    # Raw: A=0.5, B=0.5
    # Fused: A = 0.9*0.5 = 0.45, B = 0.1*0.5 = 0.05
    # Normalized: A = 0.45/0.5 = 0.9, B = 0.05/0.5 = 0.1
    state = engine.update(grid_id, {"A": 0.5, "B": 0.5})
    
    assert np.isclose(state.current_probs["A"], 0.9)
    assert np.isclose(state.current_probs["B"], 0.1)

