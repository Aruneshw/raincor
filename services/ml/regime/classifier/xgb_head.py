import xgboost as xgb
import numpy as np

class XGBRegimeHead:
    """
    Phase C: Supervised Classifier for a specific Regime Head (e.g., Synoptic).
    Outputs full probabilities instead of hard labels.
    """
    def __init__(self, num_classes: int, **xgb_kwargs):
        self.num_classes = num_classes
        
        # Default hyperparams tuned for imbalanced multi-class
        default_params = {
            'objective': 'multi:softprob',
            'num_class': self.num_classes,
            'eval_metric': 'mlogloss',
            'tree_method': 'hist',
            'random_state': 42
        }
        default_params.update(xgb_kwargs)
        self.params = default_params
        self.model = None
        
    def train(self, X: np.ndarray, y: np.ndarray, sample_weights: np.ndarray = None, num_boost_round: int = 100):
        """
        Trains the XGBoost model. Uses sample_weights to handle class imbalance 
        (e.g., giving higher weight to rare extreme regimes).
        """
        dtrain = xgb.DMatrix(X, label=y, weight=sample_weights)
        self.model = xgb.train(self.params, dtrain, num_boost_round=num_boost_round)
        
    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        """Returns the raw probability distribution across all classes for each sample."""
        if self.model is None:
            raise RuntimeError("Model is not trained.")
        dtest = xgb.DMatrix(X)
        return self.model.predict(dtest)
        
    def save(self, filepath: str):
        if self.model is not None:
            self.model.save_model(filepath)
            
    def load(self, filepath: str):
        self.model = xgb.Booster()
        self.model.load_model(filepath)
