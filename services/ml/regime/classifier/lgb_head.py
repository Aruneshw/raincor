import lightgbm as lgb
import numpy as np

class LGBRegimeHead:
    """
    Phase C: Supervised Classifier for a specific Regime Head (e.g., Synoptic).
    Outputs full probabilities instead of hard labels.
    """
    def __init__(self, num_classes: int, **lgb_kwargs):
        self.num_classes = num_classes
        
        # Default hyperparams tuned for imbalanced multi-class
        default_params = {
            'objective': 'multiclass',
            'num_class': self.num_classes,
            'metric': 'multi_logloss',
            'verbose': -1,
            'random_state': 42
        }
        default_params.update(lgb_kwargs)
        self.params = default_params
        self.model = None
        
    def train(self, X: np.ndarray, y: np.ndarray, sample_weights: np.ndarray = None, num_boost_round: int = 100):
        """
        Trains the LightGBM model. Uses sample_weights to handle class imbalance.
        """
        dtrain = lgb.Dataset(X, label=y, weight=sample_weights)
        self.model = lgb.train(self.params, dtrain, num_boost_round=num_boost_round)
        
    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        """Returns the raw probability distribution across all classes for each sample."""
        if self.model is None:
            raise RuntimeError("Model is not trained.")
        return self.model.predict(X)
        
    def save(self, filepath: str):
        if self.model is not None:
            self.model.save_model(filepath)
            
    def load(self, filepath: str):
        self.model = lgb.Booster(model_file=filepath)
