import numpy as np
from typing import Union

def z_score(x: np.ndarray, mean: float, std: float) -> np.ndarray:
    """
    Formula 15: Z-score standardization.
    """
    return (x - mean) / (std + 1e-8)

def min_max_scale(x: np.ndarray, x_min: float, x_max: float) -> np.ndarray:
    """
    Formula 16: Min-max scaling to [0,1].
    """
    return (x - x_min) / (x_max - x_min + 1e-8)

def robust_scale(x: np.ndarray, q50: float, q25: float, q75: float) -> np.ndarray:
    """
    Formula 17: Robust scaling using IQR.
    """
    return (x - q50) / (q75 - q25 + 1e-8)

def log1p_transform(x: Union[np.ndarray, float]) -> Union[np.ndarray, float]:
    """
    Formula 18: Log1p rainfall transform.
    """
    return np.log1p(x)

def inverse_log1p(x_prime: Union[np.ndarray, float]) -> Union[np.ndarray, float]:
    """
    Formula 19: Inverse Log1p transform.
    """
    return np.expm1(x_prime)

def box_cox_transform(x: np.ndarray, lmbda: float) -> np.ndarray:
    """
    Formula 20: Box-Cox transform.
    Assumes x > 0.
    """
    if abs(lmbda) < 1e-8:
        return np.log(x)
    return (np.power(x, lmbda) - 1.0) / lmbda
