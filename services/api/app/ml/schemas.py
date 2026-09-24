from pydantic import BaseModel, Field
from typing import Dict, List, Optional

class MetricResults(BaseModel):
    RMSE: float
    MAE: float
    Bias: float
    POD: float
    FAR: float
    CSI: float
    ETS: float
    Brier: Optional[float] = None
    AUC: Optional[float] = None
    CRPS: Optional[float] = None

class ThresholdEvaluation(BaseModel):
    threshold: str
    models: Dict[str, MetricResults]

class GroupEvaluation(BaseModel):
    group_name: str
    thresholds: Dict[str, Dict[str, MetricResults]]

class DimensionEvaluation(BaseModel):
    dimension_name: str
    groups: Dict[str, Dict[str, Dict[str, MetricResults]]]

class FullVerificationResponse(BaseModel):
    results: Dict[str, Dict[str, Dict[str, Dict[str, MetricResults]]]]
    
    class Config:
        schema_extra = {
            "example": {
                "results": {
                    "all": {
                        "all_grids": {
                            "T_2.5": {
                                "Adaptive_MoE": {
                                    "RMSE": 4.5,
                                    "MAE": 2.1,
                                    "Bias": 0.1,
                                    "POD": 0.85,
                                    "FAR": 0.15,
                                    "CSI": 0.75,
                                    "ETS": 0.60,
                                    "Brier": 0.05,
                                    "AUC": 0.91,
                                    "CRPS": 1.2
                                }
                            }
                        }
                    }
                }
            }
        }
