import numpy as np

def calibrate_probabilities(logits: np.ndarray, temperature: float = 1.0) -> np.ndarray:
    """
    Applies Temperature Scaling to raw tree-based logits or pre-softmax outputs 
    to calibrate the confidence of the predictions.
    
    T > 1.0 smooths the distribution (increases entropy, lowers confidence).
    T < 1.0 sharpens the distribution (decreases entropy, raises confidence).
    T = 1.0 returns the original softmax distribution.
    """
    # Prevent divide by zero
    T = max(temperature, 1e-4)
    
    # Scale logits
    scaled_logits = logits / T
    
    # Stable Softmax
    exp_logits = np.exp(scaled_logits - np.max(scaled_logits, axis=1, keepdims=True))
    probs = exp_logits / np.sum(exp_logits, axis=1, keepdims=True)
    
    return probs

class TemperatureScaler:
    """
    Stateful Temperature Scaler that learns the optimal temperature 
    to minimize Negative Log Likelihood (NLL) on a validation set.
    """
    def __init__(self):
        self.temperature = 1.0
        
    def fit(self, val_logits: np.ndarray, val_labels: np.ndarray):
        """
        In a full implementation, we use L-BFGS to find the optimal temperature.
        Here we implement a grid search placeholder for the RainMind prototype.
        """
        best_nll = float('inf')
        best_t = 1.0
        
        for t in np.linspace(0.1, 5.0, 50):
            probs = calibrate_probabilities(val_logits, temperature=t)
            
            # Cross entropy (NLL)
            # Add epsilon to prevent log(0)
            eps = 1e-7
            nll = -np.mean(np.log(probs[np.arange(len(val_labels)), val_labels] + eps))
            
            if nll < best_nll:
                best_nll = nll
                best_t = t
                
        self.temperature = best_t
        
    def transform(self, logits: np.ndarray) -> np.ndarray:
        return calibrate_probabilities(logits, temperature=self.temperature)
