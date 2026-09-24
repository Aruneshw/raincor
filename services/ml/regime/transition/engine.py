import numpy as np
from typing import Dict, Optional, Tuple, Literal
from .state import TransitionState, TransitionStateType, GridMemory

class TransitionEngine:
    def __init__(
        self,
        smoothing_alpha: float = 0.7,
        hysteresis_threshold: float = 0.05,
        transition_threshold_low: float = 0.15,
        transition_threshold_high: float = 0.35,
        use_hmm: bool = False,
        transition_matrix: Optional[np.ndarray] = None,
        regime_names: Optional[list] = None
    ):
        """
        Engine to model soft transitions between regimes for specific grids over time.
        
        Args:
            smoothing_alpha: Weight of the current observation (1.0 = no smoothing).
            hysteresis_threshold: Minimum probability margin required to switch dominant regime.
            transition_threshold_low: D_t above this is a TRANSITION.
            transition_threshold_high: D_t above this is a RAPID_TRANSITION.
            use_hmm: Whether to apply a transition matrix prior.
            transition_matrix: Shape (N, N) matrix of regime transition probabilities.
            regime_names: List of regime names corresponding to the transition matrix indices.
        """
        self.smoothing_alpha = smoothing_alpha
        self.hysteresis_threshold = hysteresis_threshold
        self.transition_threshold_low = transition_threshold_low
        self.transition_threshold_high = transition_threshold_high
        self.use_hmm = use_hmm
        self.transition_matrix = transition_matrix
        self.regime_names = regime_names
        
        # Grid memory store: grid_id -> GridMemory
        self.memory: Dict[str, GridMemory] = {}
        
        if self.use_hmm and (self.transition_matrix is None or self.regime_names is None):
            raise ValueError("transition_matrix and regime_names must be provided if use_hmm is True")

    def get_memory(self, grid_id: str) -> GridMemory:
        """Retrieves or initializes memory for a grid."""
        if grid_id not in self.memory:
            self.memory[grid_id] = GridMemory(grid_id=grid_id)
        return self.memory[grid_id]

    def _apply_hmm_prior(self, p_prev: Dict[str, float], p_t_raw: Dict[str, float]) -> Dict[str, float]:
        """Applies Markov transition matrix to previous probabilities to get a prior, then fuses."""
        if not self.use_hmm or not self.transition_matrix is not None:
            return p_t_raw
            
        # Convert dicts to arrays
        prev_vec = np.array([p_prev.get(r, 0.0) for r in self.regime_names])
        raw_vec = np.array([p_t_raw.get(r, 0.0) for r in self.regime_names])
        
        # Prior from HMM
        prior_vec = prev_vec @ self.transition_matrix
        
        # Simple Bayesian fusion (element-wise multiplication normalized)
        fused_vec = prior_vec * raw_vec
        sum_fused = np.sum(fused_vec)
        if sum_fused > 0:
            fused_vec = fused_vec / sum_fused
        else:
            fused_vec = raw_vec # fallback if fusion zeroes out
            
        return {r: float(fused_vec[i]) for i, r in enumerate(self.regime_names)}

    def update(
        self, 
        grid_id: str, 
        p_t_raw: Dict[str, float], 
        neighbour_consistency: Optional[float] = None
    ) -> TransitionState:
        """
        Updates the grid state with new probabilities and calculates transition metrics.
        """
        memory = self.get_memory(grid_id)
        
        # 1. Initialize if first time
        if memory.p_prev is None:
            dominant_regime = max(p_t_raw.items(), key=lambda x: x[1])[0]
            memory.p_prev = p_t_raw.copy()
            memory.last_dominant_regime = dominant_regime
            memory.time_in_regime = 1
            
            return TransitionState(
                grid_id=grid_id,
                current_probs=p_t_raw.copy(),
                prev_probs=None,
                delta_probs={k: 0.0 for k in p_t_raw},
                dominant_regime=dominant_regime,
                transition_magnitude=0.0,
                state_type=TransitionStateType.STABLE,
                confidence="Medium",
                neighbour_consistency=neighbour_consistency
            )

        # 2. HMM Prior (Optional)
        p_t_hmm = self._apply_hmm_prior(memory.p_prev, p_t_raw)
        
        # 3. Temporal Smoothing
        p_t = {}
        all_keys = set(p_t_hmm.keys()).union(set(memory.p_prev.keys()))
        for k in all_keys:
            val_t = p_t_hmm.get(k, 0.0)
            val_prev = memory.p_prev.get(k, 0.0)
            p_t[k] = self.smoothing_alpha * val_t + (1 - self.smoothing_alpha) * val_prev
            
        # Normalize just in case
        total_p = sum(p_t.values())
        if total_p > 0:
            p_t = {k: v / total_p for k, v in p_t.items()}

        # 4. Calculate Delta and Transition Magnitude D_t
        delta_probs = {}
        d_t = 0.0
        for k in all_keys:
            delta = p_t.get(k, 0.0) - memory.p_prev.get(k, 0.0)
            delta_probs[k] = delta
            d_t += abs(delta)
        d_t = 0.5 * d_t

        # 5. Determine Dominant Regime with Hysteresis
        raw_top_regime = max(p_t.items(), key=lambda x: x[1])[0]
        
        if raw_top_regime != memory.last_dominant_regime:
            margin = p_t.get(raw_top_regime, 0.0) - p_t.get(memory.last_dominant_regime, 0.0)
            if margin > self.hysteresis_threshold:
                new_dominant_regime = raw_top_regime
            else:
                new_dominant_regime = memory.last_dominant_regime
        else:
            new_dominant_regime = memory.last_dominant_regime
            
        # 6. Determine Transition State
        if d_t >= self.transition_threshold_high:
            state_type = TransitionStateType.RAPID_TRANSITION
        elif d_t >= self.transition_threshold_low:
            state_type = TransitionStateType.TRANSITION
        else:
            state_type = TransitionStateType.STABLE
            
        # 7. Calculate Confidence
        confidence = self._calculate_confidence(d_t, p_t, new_dominant_regime, neighbour_consistency)
        
        # 8. Determine Transition Direction
        transition_direction = None
        if state_type != TransitionStateType.STABLE and new_dominant_regime != memory.last_dominant_regime:
            transition_direction = f"{memory.last_dominant_regime} -> {new_dominant_regime}"
            
        # Update Memory
        if new_dominant_regime == memory.last_dominant_regime:
            memory.time_in_regime += 1
        else:
            memory.time_in_regime = 1
            
        memory.last_dominant_regime = new_dominant_regime
        prev_probs_copy = memory.p_prev.copy()
        memory.p_prev = p_t.copy()
        
        return TransitionState(
            grid_id=grid_id,
            current_probs=p_t,
            prev_probs=prev_probs_copy,
            delta_probs=delta_probs,
            dominant_regime=new_dominant_regime,
            transition_magnitude=d_t,
            state_type=state_type,
            confidence=confidence,
            neighbour_consistency=neighbour_consistency,
            transition_direction=transition_direction
        )

    def _calculate_confidence(
        self, 
        d_t: float, 
        p_t: Dict[str, float], 
        dominant_regime: str, 
        neighbour_consistency: Optional[float]
    ) -> Literal["High", "Medium", "Low"]:
        """Calculates a heuristic confidence score."""
        dom_prob = p_t.get(dominant_regime, 0.0)
        
        score = 0.0
        
        # High dominant probability means higher confidence
        if dom_prob > 0.6:
            score += 1.0
        elif dom_prob > 0.4:
            score += 0.5
            
        # High transition magnitude when transitioning increases confidence that transition is real
        # Low transition magnitude when stable increases confidence that it is stable
        
        if neighbour_consistency is not None:
            if neighbour_consistency > 0.7:
                score += 1.0
            elif neighbour_consistency < 0.3:
                score -= 1.0
                
        if score >= 1.5:
            return "High"
        elif score >= 0.5:
            return "Medium"
        else:
            return "Low"
