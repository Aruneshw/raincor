import numpy as np

def regime_entropy(p_k: np.ndarray) -> np.ndarray:
    """
    Formula 56: Regime entropy.
    H(p) = - sum(p_k * log(p_k))
    p_k shape: (N, K)
    Returns: (N,)
    """
    # Prevent log(0)
    p_safe = np.clip(p_k, 1e-8, 1.0)
    return -np.sum(p_safe * np.log(p_safe), axis=-1)

def normalized_entropy(p_k: np.ndarray) -> np.ndarray:
    """
    Formula 57: Normalized entropy.
    H_norm = - sum(p_k * log(p_k)) / log(K)
    """
    K = p_k.shape[-1]
    if K <= 1:
        return np.zeros(p_k.shape[:-1])
    return regime_entropy(p_k) / np.log(K)

def regime_confidence(p_k: np.ndarray) -> np.ndarray:
    """
    Formula 58: Entropy-based confidence.
    C = 1 - H_norm
    """
    return 1.0 - normalized_entropy(p_k)

def regime_probability_change(p_t: np.ndarray, p_t_minus_1: np.ndarray) -> np.ndarray:
    """
    Formula 71: Regime probability change.
    """
    return p_t - p_t_minus_1

def transition_magnitude(p_t: np.ndarray, p_t_minus_1: np.ndarray) -> np.ndarray:
    """
    Formula 72: Transition magnitude.
    D_t = 0.5 * sum(|p_k,t - p_k,t-1|)
    """
    return 0.5 * np.sum(np.abs(p_t - p_t_minus_1), axis=-1)

def exponential_smoothing_probs(p_t: np.ndarray, p_t_minus_1: np.ndarray, alpha: float) -> np.ndarray:
    """
    Formula 73: Exponential smoothing for probabilities.
    """
    return alpha * p_t + (1.0 - alpha) * p_t_minus_1
