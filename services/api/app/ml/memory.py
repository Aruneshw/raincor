import numpy as np

def ewma_bias_memory(B_prev: np.ndarray, e_t: np.ndarray, lmbda: float) -> np.ndarray:
    """
    Formula 74: EWMA bias memory.
    B_t = lambda * B_{t-1} + (1 - lambda) * e_t
    """
    return lmbda * B_prev + (1.0 - lmbda) * e_t

def grid_regime_bias_memory(B_gr_prev: np.ndarray, e_g_t: np.ndarray, q_gr_t: np.ndarray, lmbda: float) -> np.ndarray:
    """
    Formula 75: Grid-regime bias memory.
    Updates regime-specific bias using regime responsibility (q).
    B_gr_t = lambda * B_gr_{t-1} + (1 - lambda) * e_g_t * q_gr_t
    """
    # e_g_t is expanded to match the K regimes dimension of q_gr_t
    e_expanded = np.expand_dims(e_g_t, axis=-1)
    return lmbda * B_gr_prev + (1.0 - lmbda) * e_expanded * q_gr_t

def transition_bias_memory(B_trans_prev: np.ndarray, e_g_t: np.ndarray, q_trans_t: np.ndarray, lmbda: float) -> np.ndarray:
    """
    Formula 76: Transition bias memory.
    """
    # Similar to regime bias memory, but for transition responsibilities
    e_expanded = np.expand_dims(e_g_t, axis=-1)
    return lmbda * B_trans_prev + (1.0 - lmbda) * e_expanded * q_trans_t
