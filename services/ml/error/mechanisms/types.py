from enum import Enum
from typing import Dict
from pydantic import BaseModel, Field

class ErrorMechanism(str, Enum):
    SPATIAL_DISPLACEMENT = "SPATIAL_DISPLACEMENT"
    TEMPORAL_TIMING = "TEMPORAL_TIMING"
    INTENSITY = "INTENSITY"
    OROGRAPHIC = "OROGRAPHIC"
    COASTAL = "COASTAL"
    CONVECTIVE = "CONVECTIVE"
    MOISTURE_TRANSPORT = "MOISTURE_TRANSPORT"
    PHYSICS_RESIDUAL = "PHYSICS_RESIDUAL"

class MechanismProbabilities(BaseModel):
    """
    Represents the probabilistic distribution of error mechanisms.
    E = [e1, e2, ... em] where values represent confidence/probability.
    """
    probabilities: Dict[ErrorMechanism, float] = Field(
        description="Mapping of error mechanism to probability (0.0 to 1.0)."
    )
    
    def get_dominant_mechanisms(self, threshold: float = 0.5) -> Dict[ErrorMechanism, float]:
        return {k: v for k, v in self.probabilities.items() if v >= threshold}
