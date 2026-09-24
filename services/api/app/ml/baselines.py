import numpy as np

def additive_bias_correction(y_raw: np.ndarray, b: float) -> np.ndarray:
    """
    Formula 91: Additive bias correction.
    """
    return y_raw + b

def multiplicative_scaling(y_raw: np.ndarray, y_bar_obs: float, y_bar_raw: float, epsilon: float = 1e-8) -> np.ndarray:
    """
    Formula 92: Multiplicative scaling.
    """
    return y_raw * (y_bar_obs / (y_bar_raw + epsilon))

def local_intensity_scaling_factor(y_bar_obs_wet: float, y_bar_raw_wet: float, epsilon: float = 1e-8) -> float:
    """
    Formula 93: Local intensity scaling factor.
    """
    return y_bar_obs_wet / (y_bar_raw_wet + epsilon)

def empirical_cdf(x: np.ndarray, data: np.ndarray) -> np.ndarray:
    """
    Formula 102: Empirical CDF.
    F_n(x) = (1/n) * sum(1(x_i <= x))
    """
    n = len(data)
    # Broadcasting to compute CDF for multiple x values
    # x shape: (M, 1), data shape: (N,) -> matches to (M, N)
    x_expanded = np.expand_dims(x, axis=-1)
    counts = np.sum(data <= x_expanded, axis=-1)
    return counts / float(n)

def empirical_quantile(p: np.ndarray, data: np.ndarray) -> np.ndarray:
    """
    Formula 103: Empirical quantile (inverse CDF).
    Q(p) = inf{x : F(x) >= p}
    Using numpy's quantile function which interpolates by default, 
    but for exact step-function inversion we can use nearest or lower.
    """
    return np.quantile(data, p, method='lower')

def generic_quantile_mapping(x_mod: np.ndarray, data_obs: np.ndarray, data_mod: np.ndarray) -> np.ndarray:
    """
    Formula 101: Generic quantile mapping.
    x_bc = F_obs^{-1}(F_mod(x_mod))
    """
    # 1. Compute empirical CDF of the model data at x_mod
    p = empirical_cdf(x_mod, data_mod)
    # 2. Compute the inverse CDF of the observed data at probability p
    return empirical_quantile(p, data_obs)
