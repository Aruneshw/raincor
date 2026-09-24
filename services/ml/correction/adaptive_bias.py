import torch
import torch.nn as nn
from enum import Enum
from typing import Dict, Any, Tuple

class CorrectionMode(Enum):
    RAW_NWP = "raw_nwp"
    STATIC_BIAS = "static_bias"
    QM = "qm"
    ML = "ml"
    REGIME_ML = "regime_ml"
    MOE = "moe"
    ADAPTIVE_MOE = "adaptive_moe"

class AdaptiveBiasCorrection(nn.Module):
    def __init__(self, mode: str, max_rainfall: float = 500.0, memory_type: str = 'ewma', num_regimes: int = 5, num_lead_times: int = 24):
        """
        Adaptive Bias Correction Layer.
        Core formulation:
        CorrectedRainfall = NWP + WeightedExpertCorrection + MemoryBias + TransitionBias
        """
        super().__init__()
        self.mode = CorrectionMode(mode)
        self.max_rainfall = max_rainfall
        self.memory_type = memory_type
        
        # Memory states (can be expanded to spatial grid states)
        self.register_buffer('recent_bias', torch.zeros(1))
        self.register_buffer('long_term_bias', torch.zeros(1))
        
        # Regime and Lead-time specific biases
        self.register_buffer('regime_bias', torch.zeros(num_regimes))
        self.register_buffer('lead_time_bias', torch.zeros(num_lead_times))
        
        # Hyperparameters for EWMA
        self.ewma_alpha = 0.1
        
        # For Kalman-style, we would track uncertainty/variance as well
        self.register_buffer('variance', torch.ones(1))
        
    def update_memory(self, observed_bias: torch.Tensor, mask: torch.Tensor = None, regime_idx: torch.Tensor = None, lead_time_idx: torch.Tensor = None):
        if mask is not None and mask.any():
            mean_bias = observed_bias[mask].mean()
        else:
            mean_bias = observed_bias.mean()
            
        if torch.isnan(mean_bias):
            return
            
        if self.memory_type == 'ewma':
            self.recent_bias = (1 - self.ewma_alpha) * self.recent_bias + self.ewma_alpha * mean_bias
            self.long_term_bias = 0.99 * self.long_term_bias + 0.01 * mean_bias
            
            # Update regime-specific bias if regime is provided
            if regime_idx is not None:
                for idx in torch.unique(regime_idx):
                    idx_mask = (regime_idx == idx)
                    if mask is not None:
                        idx_mask = idx_mask & mask
                    if idx_mask.any():
                        reg_mean = observed_bias[idx_mask].mean()
                        if not torch.isnan(reg_mean):
                            self.regime_bias[idx] = (1 - self.ewma_alpha) * self.regime_bias[idx] + self.ewma_alpha * reg_mean
                            
            # Update lead-time specific bias if provided
            if lead_time_idx is not None:
                for idx in torch.unique(lead_time_idx):
                    idx_mask = (lead_time_idx == idx)
                    if mask is not None:
                        idx_mask = idx_mask & mask
                    if idx_mask.any():
                        lt_mean = observed_bias[idx_mask].mean()
                        if not torch.isnan(lt_mean):
                            self.lead_time_bias[idx] = (1 - self.ewma_alpha) * self.lead_time_bias[idx] + self.ewma_alpha * lt_mean

        elif self.memory_type == 'kalman':
            # Simple 1D Kalman filter update
            process_noise = 0.01
            measurement_noise = 0.1
            
            # Prediction
            predicted_variance = self.variance + process_noise
            
            # Update
            kalman_gain = predicted_variance / (predicted_variance + measurement_noise)
            self.recent_bias = self.recent_bias + kalman_gain * (mean_bias - self.recent_bias)
            self.variance = (1 - kalman_gain) * predicted_variance
            
    def forward(
        self, 
        nwp_forecast: torch.Tensor, 
        expert_correction: torch.Tensor = None, 
        transition_bias: torch.Tensor = None,
        confidence: torch.Tensor = None,
        regime_idx: torch.Tensor = None,
        lead_time_idx: torch.Tensor = None
    ) -> torch.Tensor:
        """
        nwp_forecast: Raw NWP rainfall predictions
        expert_correction: Weighted correction from MoE layer
        transition_bias: Regime transition bias
        confidence: Model confidence in [0, 1] for the correction
        regime_idx: Tensor containing integer indices for current regimes
        lead_time_idx: Tensor containing integer indices for lead times
        """
        if confidence is None:
            confidence = torch.ones_like(nwp_forecast)
            
        if transition_bias is None:
            transition_bias = torch.zeros_like(nwp_forecast)
            
        if expert_correction is None:
            expert_correction = torch.zeros_like(nwp_forecast)
            
        corrected = nwp_forecast.clone()
        
        if self.mode == CorrectionMode.RAW_NWP:
            return self._apply_constraints(corrected)
            
        if self.mode in [CorrectionMode.STATIC_BIAS, CorrectionMode.QM]:
            # For this simplified setup, we treat long_term_bias as the static correction
            corrected += self.long_term_bias
            
        if self.mode in [CorrectionMode.ML, CorrectionMode.REGIME_ML, CorrectionMode.MOE, CorrectionMode.ADAPTIVE_MOE]:
            # Apply expert/ML correction weighted by confidence to avoid unstable jumps
            corrected += expert_correction * confidence
            
            if self.mode in [CorrectionMode.REGIME_ML, CorrectionMode.ADAPTIVE_MOE] and regime_idx is not None:
                # Add regime specific bias
                regime_b = self.regime_bias[regime_idx]
                corrected += regime_b * confidence
                
        if self.mode == CorrectionMode.ADAPTIVE_MOE:
            # Add temporal memory, transition biases, and lead-time biases
            corrected += self.recent_bias * confidence
            corrected += transition_bias * confidence
            
            if lead_time_idx is not None:
                lt_b = self.lead_time_bias[lead_time_idx]
                corrected += lt_b * confidence
            
        return self._apply_constraints(corrected)
        
    def _apply_constraints(self, rainfall: torch.Tensor) -> torch.Tensor:
        # Prevent negative rainfall
        rainfall = torch.relu(rainfall)
        
        # Clip physically invalid values (e.g., > 500 mm)
        rainfall = torch.clamp(rainfall, max=self.max_rainfall)
        
        return rainfall
