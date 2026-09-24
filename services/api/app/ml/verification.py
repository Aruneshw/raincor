import numpy as np

def mean_bias(y_hat: np.ndarray, y: np.ndarray) -> float:
    """Formula 21: Mean error / bias."""
    return np.mean(y_hat - y)

def mean_absolute_error(y_hat: np.ndarray, y: np.ndarray) -> float:
    """Formula 23: Mean absolute error (MAE)."""
    return np.mean(np.abs(y_hat - y))

def mean_squared_error(y_hat: np.ndarray, y: np.ndarray) -> float:
    """Formula 24: Mean squared error (MSE)."""
    return np.mean((y_hat - y) ** 2)

def root_mean_squared_error(y_hat: np.ndarray, y: np.ndarray) -> float:
    """Formula 25: Root mean squared error (RMSE)."""
    return np.sqrt(mean_squared_error(y_hat, y))

def normalized_rmse(y_hat: np.ndarray, y: np.ndarray) -> float:
    """Formula 26: Normalized RMSE."""
    rmse = root_mean_squared_error(y_hat, y)
    rng = np.max(y) - np.min(y)
    return rmse / (rng + 1e-8)

def mean_absolute_percentage_error(y_hat: np.ndarray, y: np.ndarray) -> float:
    """Formula 27: Mean absolute percentage error (MAPE)."""
    # Guard against division by zero
    safe_y = np.where(y == 0, 1e-8, y)
    return 100.0 * np.mean(np.abs((y_hat - y) / safe_y))

# Categorical Verification (Formulas 141-149)

def _get_contingency(y_hat: np.ndarray, y: np.ndarray, threshold: float) -> tuple[float, float, float, float]:
    """Helper to compute TP, FP, FN, TN for a given threshold."""
    y_hat_bool = y_hat >= threshold
    y_bool = y >= threshold
    
    tp = np.sum(y_hat_bool & y_bool)
    fp = np.sum(y_hat_bool & ~y_bool)
    fn = np.sum(~y_hat_bool & y_bool)
    tn = np.sum(~y_hat_bool & ~y_bool)
    
    return float(tp), float(fp), float(fn), float(tn)

def accuracy(y_hat: np.ndarray, y: np.ndarray, threshold: float) -> float:
    """Formula 142: Accuracy."""
    tp, fp, fn, tn = _get_contingency(y_hat, y, threshold)
    n = tp + fp + fn + tn
    return (tp + tn) / (n + 1e-8)

def frequency_bias(y_hat: np.ndarray, y: np.ndarray, threshold: float) -> float:
    """Formula 143: Frequency bias."""
    tp, fp, fn, tn = _get_contingency(y_hat, y, threshold)
    return (tp + fp) / (tp + fn + 1e-8)

def probability_of_detection(y_hat: np.ndarray, y: np.ndarray, threshold: float) -> float:
    """Formula 144: Probability of detection / hit rate (POD)."""
    tp, fp, fn, tn = _get_contingency(y_hat, y, threshold)
    return tp / (tp + fn + 1e-8)

def false_alarm_ratio(y_hat: np.ndarray, y: np.ndarray, threshold: float) -> float:
    """Formula 145: False alarm ratio (FAR)."""
    tp, fp, fn, tn = _get_contingency(y_hat, y, threshold)
    return fp / (tp + fp + 1e-8)

def success_ratio(y_hat: np.ndarray, y: np.ndarray, threshold: float) -> float:
    """Formula 146: Success ratio."""
    return 1.0 - false_alarm_ratio(y_hat, y, threshold)

def critical_success_index(y_hat: np.ndarray, y: np.ndarray, threshold: float) -> float:
    """Formula 147: Critical success index (CSI)."""
    tp, fp, fn, tn = _get_contingency(y_hat, y, threshold)
    return tp / (tp + fp + fn + 1e-8)

def equitable_threat_score(y_hat: np.ndarray, y: np.ndarray, threshold: float) -> float:
    """Formula 148 & 149: Equitable threat score (ETS)."""
    tp, fp, fn, tn = _get_contingency(y_hat, y, threshold)
    n = tp + fp + fn + tn
    
    # Formula 149: Random hits
    tp_r = ((tp + fp) * (tp + fn)) / (n + 1e-8)
    
    # Formula 148: ETS
    return (tp - tp_r) / (tp + fp + fn - tp_r + 1e-8)
