import numpy as np

def softmax(z: np.ndarray, temperature: float = 1.0) -> np.ndarray:
    """
    Formulas 51 & 52: Stable Softmax with temperature scaling.
    """
    z_scaled = z / temperature
    z_max = np.max(z_scaled, axis=-1, keepdims=True)
    exp_z = np.exp(z_scaled - z_max)
    return exp_z / np.sum(exp_z, axis=-1, keepdims=True)

def router_logits(features: np.ndarray, W_r: np.ndarray, b_r: np.ndarray) -> np.ndarray:
    """
    Formula 81: Router logits.
    z_g = W_r * [Features] + b_r
    """
    return np.dot(features, W_r.T) + b_r

def router_weights(z_g: np.ndarray, temperature: float = 1.0) -> np.ndarray:
    """
    Formula 82: Router weights.
    w_g = softmax(z_g / T)
    """
    return softmax(z_g, temperature)

def top_k_mask(w_g: np.ndarray, k: int) -> np.ndarray:
    """
    Formula 84: Top-k mask.
    """
    mask = np.zeros_like(w_g)
    # Get the indices of the top k elements along the last axis
    # argpartition is faster than argsort for this
    if k >= w_g.shape[-1]:
        return np.ones_like(w_g)
        
    top_k_idx = np.argpartition(w_g, -k, axis=-1)[..., -k:]
    # Use advanced indexing to set mask to 1 for top_k_idx
    np.put_along_axis(mask, top_k_idx, 1.0, axis=-1)
    return mask

def top_k_renormalize(w_g: np.ndarray, mask: np.ndarray, epsilon: float = 1e-8) -> np.ndarray:
    """
    Formula 85: Top-k renormalization.
    """
    masked_w = w_g * mask
    return masked_w / (np.sum(masked_w, axis=-1, keepdims=True) + epsilon)

def sparse_moe_output(w_g_tilde: np.ndarray, E_k: np.ndarray) -> np.ndarray:
    """
    Formula 86: Sparse MoE output combination.
    E_k is shape (..., K, output_dim)
    """
    # w_g_tilde is (..., K) -> expand to (..., K, 1) to multiply with E_k
    w_expanded = np.expand_dims(w_g_tilde, axis=-1)
    return np.sum(w_expanded * E_k, axis=-2)

def expert_correction(E_k: np.ndarray, R_NWP: np.ndarray) -> np.ndarray:
    """
    Formula 87: Expert correction.
    C_k(X_g) = E_k(X_g) - R_NWP
    """
    R_expanded = np.expand_dims(R_NWP, axis=-2)
    return E_k - R_expanded

def weighted_correction(R_NWP: np.ndarray, w_g_tilde: np.ndarray, C_k: np.ndarray) -> np.ndarray:
    """
    Formula 88: Weighted correction form.
    R_hat = R_NWP + sum(w_g_tilde * C_k)
    """
    correction = sparse_moe_output(w_g_tilde, C_k)
    return R_NWP + correction
