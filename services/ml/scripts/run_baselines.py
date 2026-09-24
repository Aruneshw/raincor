import sys
import os
import json
import numpy as np

# Add the parent directory to the path so we can import services
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from baselines.raw_nwp import RawNWPBaseline
from baselines.climatology import ClimatologyBaseline
from baselines.simple_bias import SimpleBiasCorrection
from correction.qm.qm import EmpiricalQuantileMapping
from evaluation.metrics import MetricsEngine

def generate_data(n_samples=10000):
    """
    Generates synthetic NWP and Observation data.
    Simulates a scenario where NWP generally overestimates rainfall 
    and misses extreme events.
    """
    # Ground truth (Obs) follows an exponential distribution (many 0s, few large values)
    obs = np.random.exponential(scale=5.0, size=n_samples)
    
    # NWP model is biased (add +3.0 bias) and has some noise
    nwp = obs + 3.0 + np.random.normal(scale=1.5, size=n_samples)
    nwp = np.maximum(nwp, 0.0) # No negative rain
    
    # Split into train and test
    split = int(0.8 * n_samples)
    
    X_train, X_test = nwp[:split], nwp[split:]
    y_train, y_test = obs[:split], obs[split:]
    
    return X_train, y_train, X_test, y_test

def main():
    print("Generating synthetic data...")
    X_train, y_train, X_test, y_test = generate_data()
    
    models = {
        "Raw NWP": RawNWPBaseline(),
        "Climatology": ClimatologyBaseline(),
        "Simple Bias": SimpleBiasCorrection(),
        "Quantile Mapping": EmpiricalQuantileMapping(n_quantiles=100)
    }
    
    engine = MetricsEngine(threshold=2.5)
    results = {}
    
    print("\nTraining and Evaluating Baselines...")
    for name, model in models.items():
        # Train
        model.train(X_train, y_train)
        
        # Test
        preds = model.predict(X_test)
        
        # Evaluate
        metrics = engine.evaluate(y_test, preds)
        results[name] = metrics
        
        # Save model to disk
        model_path = os.path.join(os.path.dirname(__file__), f"../{name.replace(' ', '_').lower()}.joblib")
        try:
            model.save(model_path)
            print(f"[{name}] Saved parameters to {model_path}")
        except Exception as e:
            pass # Ignore saving if not applicable (like Raw NWP)
            
        print(f"\n--- {name} ---")
        for k, v in metrics.items():
            print(f"{k}: {v:.4f}")
            
    # Output to JSON
    output_path = os.path.join(os.path.dirname(__file__), "../baseline_metrics.json")
    with open(output_path, "w") as f:
        json.dump(results, f, indent=4)
        
    print(f"\nSaved metrics to {output_path}")

if __name__ == "__main__":
    main()
