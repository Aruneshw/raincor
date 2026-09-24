import pandas as pd
import json
import torch
import numpy as np
from typing import Dict, List, Any
from services.ml.evaluation.metrics import MetricsEngine
from services.ml.evaluation.probabilistic import crps_quantile, brier_score, roc_auc

class VerificationEngine:
    """
    RainMind Verification Engine.
    Evaluates predictions across multiple spatial, temporal, and categorical dimensions.
    """
    def __init__(self, thresholds: List[float] = [2.5, 15.6, 64.5]):
        self.thresholds = thresholds
        # The models to compare against
        self.models = ['Raw_NWP', 'QM', 'ML_Baseline', 'Regime_Aware', 'Hierarchical_MoE', 'Adaptive_MoE']
        
    def evaluate_slice(self, df: pd.DataFrame, model: str, threshold: float) -> Dict[str, float]:
        """
        Evaluate a single slice of data for a specific model and threshold.
        Assumes df contains: 'observed', f'{model}_pred'
        Optionally contains probabilistic components for full evaluation.
        """
        engine = MetricsEngine(threshold=threshold)
        
        y_true = df['observed'].values
        y_pred = df[f'{model}_pred'].values
        
        # Base deterministic and categorical metrics
        metrics = engine.evaluate(y_true, y_pred)
        
        # We need a 2D grid to compute true FSS, but for 1D slices we can approximate or skip
        # Assuming the dataframe has a 'grid_id' we can just map it, but for a 1D dataframe 
        # FSS is skipped unless specifically arranged as an image array.
        
        # Probabilistic metrics
        if f'{model}_prob' in df.columns:
            probs = torch.tensor(df[f'{model}_prob'].values, dtype=torch.float32)
            obs_bin = torch.tensor((y_true >= threshold).astype(float), dtype=torch.float32)
            
            bs = brier_score(probs, obs_bin).mean().item()
            _, _, auc = roc_auc(probs, obs_bin)
            
            metrics['Brier'] = float(bs)
            metrics['AUC'] = float(auc)
            
        if f'{model}_q10' in df.columns and f'{model}_q50' in df.columns and f'{model}_q90' in df.columns:
            quantiles = torch.tensor(df[[f'{model}_q10', f'{model}_q50', f'{model}_q90']].values, dtype=torch.float32)
            obs_t = torch.tensor(y_true, dtype=torch.float32)
            q_levels = torch.tensor([0.1, 0.5, 0.9])
            crps = crps_quantile(quantiles, obs_t, q_levels).mean().item()
            metrics['CRPS'] = float(crps)
            
        return metrics

    def run_full_verification(self, df: pd.DataFrame, output_file: str = "verification_results.json"):
        """
        Runs comprehensive verification over all required dimensions.
        """
        results = {}
        
        dimensions = {
            'all': lambda df: {'all_grids': df},
            'region': lambda df: {str(k): v for k, v in df.groupby('region')} if 'region' in df.columns else {},
            'district': lambda df: {str(k): v for k, v in df.groupby('district')} if 'district' in df.columns else {},
            'season': lambda df: {str(k): v for k, v in df.groupby('season')} if 'season' in df.columns else {},
            'regime': lambda df: {str(k): v for k, v in df.groupby('regime')} if 'regime' in df.columns else {},
            'lead_time': lambda df: {str(k): v for k, v in df.groupby('lead_time')} if 'lead_time' in df.columns else {}
        }
        
        for dim_name, dim_func in dimensions.items():
            results[dim_name] = {}
            groups = dim_func(df)
            
            for group_name, group_df in groups.items():
                results[dim_name][group_name] = {}
                
                for thresh in self.thresholds:
                    results[dim_name][group_name][f"T_{thresh}"] = {}
                    
                    for model in self.models:
                        if f"{model}_pred" in group_df.columns:
                            metrics = self.evaluate_slice(group_df, model, thresh)
                            results[dim_name][group_name][f"T_{thresh}"][model] = metrics
                            
        # Output Machine Readable results
        with open(output_file, 'w') as f:
            json.dump(results, f, indent=2)
            
        return results
