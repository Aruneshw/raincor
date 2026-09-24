import torch
from typing import Tuple

def crps_quantile(forecast_quantiles: torch.Tensor, observed: torch.Tensor, quantiles: torch.Tensor) -> torch.Tensor:
    """
    Continuous Ranked Probability Score (CRPS) approximation via quantile (pinball) loss.
    """
    if observed.dim() == forecast_quantiles.dim() - 1:
        observed = observed.unsqueeze(-1)
        
    errors = observed - forecast_quantiles
    pinball_loss = torch.max(quantiles * errors, (quantiles - 1) * errors)
    return pinball_loss.mean(dim=-1)

def brier_score(forecast_probs: torch.Tensor, observed_binary: torch.Tensor) -> torch.Tensor:
    """
    Brier Score: mean squared error of probabilistic forecasts.
    """
    return (forecast_probs - observed_binary) ** 2

def reliability_curve(
    forecast_probs: torch.Tensor, 
    observed_binary: torch.Tensor, 
    num_bins: int = 10
) -> Tuple[torch.Tensor, torch.Tensor, torch.Tensor]:
    """
    Computes data for a reliability diagram.
    """
    bins = torch.linspace(0, 1, num_bins + 1, device=forecast_probs.device)
    
    empirical_probs = torch.zeros(num_bins, device=forecast_probs.device)
    bin_counts = torch.zeros(num_bins, device=forecast_probs.device)
    bin_centers = (bins[:-1] + bins[1:]) / 2
    
    for i in range(num_bins):
        lower = bins[i]
        upper = bins[i+1]
        
        if i == num_bins - 1:
            mask = (forecast_probs >= lower) & (forecast_probs <= upper)
        else:
            mask = (forecast_probs >= lower) & (forecast_probs < upper)
            
        count = mask.sum()
        bin_counts[i] = count
        if count > 0:
            empirical_probs[i] = observed_binary[mask].float().mean()
            
    return bin_centers, empirical_probs, bin_counts

def roc_auc(forecast_probs: torch.Tensor, observed_binary: torch.Tensor) -> Tuple[torch.Tensor, torch.Tensor, float]:
    """
    Computes ROC curve (TPR, FPR) and AUC using trapezoidal rule.
    """
    thresholds = torch.linspace(1, 0, 100, device=forecast_probs.device)
    tpr = []
    fpr = []
    
    P = observed_binary.sum().float()
    N = (~observed_binary.bool()).sum().float()
    
    for t in thresholds:
        pred = forecast_probs >= t
        hits = (pred & observed_binary.bool()).sum().float()
        fas = (pred & ~observed_binary.bool()).sum().float()
        
        tpr.append(hits / (P + 1e-7))
        fpr.append(fas / (N + 1e-7))
        
    tpr = torch.stack(tpr)
    fpr = torch.stack(fpr)
    
    auc = torch.trapz(tpr, fpr).item()
    return tpr, fpr, auc
