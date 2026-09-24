import torch
import torch.nn as nn

class PlattCalibration(nn.Module):
    def __init__(self):
        """
        Probabilistic calibration using Platt Scaling (Logistic Regression).
        Converts raw model probabilities to calibrated probabilities.
        """
        super().__init__()
        self.a = nn.Parameter(torch.tensor(1.0))
        self.b = nn.Parameter(torch.tensor(0.0))
        
    def forward(self, raw_probs: torch.Tensor) -> torch.Tensor:
        """
        raw_probs: probabilities in [0, 1]
        """
        eps = 1e-6
        raw_probs_clipped = torch.clamp(raw_probs, eps, 1 - eps)
        
        # Logit transformation
        logits = torch.log(raw_probs_clipped / (1 - raw_probs_clipped))
        
        # Linear scaling
        calibrated_logits = self.a * logits + self.b
        
        # Convert back to probabilities
        calibrated_probs = torch.sigmoid(calibrated_logits)
        return calibrated_probs
