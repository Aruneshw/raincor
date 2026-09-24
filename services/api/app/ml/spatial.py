import numpy as np

def adjacency_from_distance(d_ij: np.ndarray, sigma_d: float, r0: float) -> np.ndarray:
    """
    Formula 65: Static spatial graph adjacency from distance.
    A_ij = exp(- d_ij^2 / (2 * sigma_d^2)) * I(d_ij <= r0)
    """
    adj = np.exp(- (d_ij ** 2) / (2.0 * sigma_d ** 2))
    mask = (d_ij <= r0).astype(float)
    return adj * mask

def wind_alignment(v_i: np.ndarray, d_ij_hat: np.ndarray, epsilon: float = 1e-8) -> np.ndarray:
    """
    Formula 66: Downwind influence score.
    v_i: Wind vector at node i (N, 2)
    d_ij_hat: Unit direction vector from i to j (N, N, 2)
    Returns: W_ij (N, N)
    """
    # Norm of v_i (N,)
    v_i_norm = np.linalg.norm(v_i, axis=1, keepdims=True)
    # v_i_expanded to (N, 1, 2) to broadcast with (N, N, 2)
    v_i_expanded = np.expand_dims(v_i, axis=1)
    
    # Dot product along the vector dimension (axis=2)
    dot_product = np.sum(v_i_expanded * d_ij_hat, axis=2)
    
    # Divide by norm + epsilon
    alignment = dot_product / (v_i_norm + epsilon)
    
    # ReLU-like max with 0
    return np.maximum(0.0, alignment)

def moisture_transport_edge_weight(A_ij: np.ndarray, W_ij: np.ndarray, M_ij: float, T_ij: float) -> np.ndarray:
    """
    Formula 67: Atmospheric Transport Graph edge weight.
    """
    return A_ij * W_ij * M_ij * T_ij
