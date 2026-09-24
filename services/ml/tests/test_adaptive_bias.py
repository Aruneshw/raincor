import torch
import pytest
from services.ml.correction.adaptive_bias import AdaptiveBiasCorrection, CorrectionMode

@pytest.fixture
def raw_nwp():
    return torch.tensor([10.0, -5.0, 600.0, 0.0, 20.0])

@pytest.fixture
def expert_correction():
    return torch.tensor([5.0, 2.0, 0.0, -2.0, 10.0])

@pytest.fixture
def transition_bias():
    return torch.tensor([1.0, 0.5, 0.0, -1.0, 2.0])

def test_prevent_negative_rainfall(raw_nwp):
    corrector = AdaptiveBiasCorrection(mode="raw_nwp")
    corrected = corrector(raw_nwp)
    assert torch.all(corrected >= 0.0)
    assert corrected[1] == 0.0 # -5.0 becomes 0.0

def test_clip_physically_invalid_values(raw_nwp):
    corrector = AdaptiveBiasCorrection(mode="raw_nwp", max_rainfall=500.0)
    corrected = corrector(raw_nwp)
    assert torch.all(corrected <= 500.0)
    assert corrected[2] == 500.0 # 600.0 clipped to 500.0

def test_preserve_raw_nwp_low_confidence(raw_nwp, expert_correction):
    corrector = AdaptiveBiasCorrection(mode="moe")
    
    # 0 confidence should mean 0 expert correction
    confidence = torch.zeros_like(raw_nwp)
    corrected = corrector(raw_nwp, expert_correction=expert_correction, confidence=confidence)
    
    # Raw NWP values (after physical constraints)
    expected = torch.tensor([10.0, 0.0, 500.0, 0.0, 20.0])
    assert torch.allclose(corrected, expected)

def test_confidence_weighted_correction(raw_nwp, expert_correction):
    corrector = AdaptiveBiasCorrection(mode="moe")
    
    confidence = torch.tensor([1.0, 0.5, 0.0, 0.8, 1.0])
    corrected = corrector(raw_nwp, expert_correction=expert_correction, confidence=confidence)
    
    # Expected: max(min(nwp + expert * conf, 500), 0)
    expected = raw_nwp + expert_correction * confidence
    expected = torch.relu(expected)
    expected = torch.clamp(expected, max=500.0)
    
    assert torch.allclose(corrected, expected)

def test_ewma_memory_update():
    corrector = AdaptiveBiasCorrection(mode="adaptive_moe", memory_type="ewma")
    assert corrector.recent_bias.item() == 0.0
    assert corrector.long_term_bias.item() == 0.0
    
    observed_bias = torch.tensor([10.0, 10.0, 10.0]) # Mean is 10.0
    corrector.update_memory(observed_bias)
    
    # EWMA alpha is 0.1 for recent bias, 0.01 for long term
    assert pytest.approx(corrector.recent_bias.item(), 0.01) == 1.0 # 0.1 * 10
    assert pytest.approx(corrector.long_term_bias.item(), 0.01) == 0.1 # 0.01 * 10

def test_ablation_modes(raw_nwp, expert_correction, transition_bias):
    for mode in CorrectionMode:
        corrector = AdaptiveBiasCorrection(mode=mode.value)
        
        # Give memory some state
        corrector.recent_bias.fill_(2.0)
        corrector.long_term_bias.fill_(3.0)
        
        confidence = torch.ones_like(raw_nwp)
        
        corrected = corrector(
            raw_nwp, 
            expert_correction=expert_correction, 
            transition_bias=transition_bias,
            confidence=confidence
        )
        
        assert torch.all(corrected >= 0.0)
        assert torch.all(corrected <= 500.0)
        assert corrected.shape == raw_nwp.shape
