import torch
import torch.nn as nn
from typing import Dict, List

class QuantileRegression(nn.Module):
    def __init__(self, input_dim: int, quantiles: List[float] = [0.1, 0.5, 0.9]):
        """
        Predicts specific quantiles (e.g., P10, P50, P90) from input features.
        """
        super().__init__()
        self.quantiles = quantiles
        self.num_quantiles = len(quantiles)
        
        self.network = nn.Sequential(
            nn.Linear(input_dim, 64),
            nn.ReLU(),
            nn.Linear(64, self.num_quantiles)
        )
        
    def forward(self, x: torch.Tensor) -> torch.Tensor:
        outputs = self.network(x)
        # Sort to ensure monotonic quantiles (e.g. P10 <= P50 <= P90)
        outputs, _ = torch.sort(outputs, dim=-1)
        # Prevent negative rainfall
        return torch.relu(outputs)

class EnsembleProbabilisticExtractor:
    def __init__(self, quantiles: List[float] = [0.1, 0.5, 0.9]):
        """
        Extracts quantiles and exceedance probabilities from an ensemble of forecasts.
        """
        self.quantiles = torch.tensor(quantiles)
        
    def extract_quantiles(self, ensemble_forecasts: torch.Tensor) -> torch.Tensor:
        """
        ensemble_forecasts: (..., num_members)
        returns: (..., num_quantiles)
        """
        q = torch.quantile(ensemble_forecasts, self.quantiles.to(ensemble_forecasts.device), dim=-1)
        # quantile returns shape (num_quantiles, ...)
        # we want to move num_quantiles to the last dimension
        dims = list(range(1, q.dim())) + [0]
        return q.permute(*dims)
        
    def extract_threshold_probabilities(
        self, 
        ensemble_forecasts: torch.Tensor, 
        thresholds: Dict[str, float]
    ) -> Dict[str, torch.Tensor]:
        """
        Computes the probability of exceeding specific thresholds.
        thresholds: configurable dict, e.g., {'heavy': 64.5, 'very_heavy': 115.5, 'extreme': 204.5}
        """
        probs = {}
        for name, threshold in thresholds.items():
            exceedance = (ensemble_forecasts >= threshold).float()
            probs[name] = exceedance.mean(dim=-1)
        return probs

    def extract_spread(self, ensemble_forecasts: torch.Tensor) -> torch.Tensor:
        """
        Returns the standard deviation (spread) of the ensemble
        """
        return ensemble_forecasts.std(dim=-1)
