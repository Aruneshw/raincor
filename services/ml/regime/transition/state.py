import enum
from typing import Dict, Optional, Literal
from dataclasses import dataclass, field
import numpy as np

class TransitionStateType(enum.Enum):
    STABLE = "STABLE"
    TRANSITION = "TRANSITION"
    RAPID_TRANSITION = "RAPID_TRANSITION"

@dataclass
class GridMemory:
    """
    Stores historical regime probabilities and state for a single grid.
    """
    grid_id: str
    p_prev: Optional[Dict[str, float]] = None
    last_dominant_regime: Optional[str] = None
    time_in_regime: int = 0
    # Add any other history needed for HMM or long-term smoothing

@dataclass
class TransitionState:
    """
    Represents the calculated transition state at time t for a given grid.
    """
    grid_id: str
    current_probs: Dict[str, float]
    prev_probs: Optional[Dict[str, float]]
    delta_probs: Dict[str, float]
    
    dominant_regime: str
    transition_magnitude: float  # D_t
    state_type: TransitionStateType
    confidence: Literal["High", "Medium", "Low"]
    
    # Hysteresis and neighbor metrics
    neighbour_consistency: Optional[float] = None
    transition_direction: Optional[str] = None  # e.g., 'Active Monsoon -> Break Monsoon'
    
    def is_transitioning(self) -> bool:
        return self.state_type in (TransitionStateType.TRANSITION, TransitionStateType.RAPID_TRANSITION)
