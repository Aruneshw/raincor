import json
import os
import numpy as np

class RegimeMetadataStore:
    """
    Phase B: Storage of discovered regimes for meteorological analysis.
    Explicitly separates discovered statistical clusters from "official" meteorological regimes.
    """
    def __init__(self, storage_dir: str):
        self.storage_dir = storage_dir
        os.makedirs(self.storage_dir, exist_ok=True)
        
    def save_cluster_metadata(self, name: str, feature_names: list, centers: np.ndarray, cluster_sizes: list):
        """Saves centroid data for offline meteorological validation."""
        data = {
            "name": name,
            "warning": "These are unvalidated statistical clusters, NOT official meteorological regimes.",
            "features": feature_names,
            "centers": centers.tolist() if centers is not None else [],
            "sizes": cluster_sizes
        }
        
        path = os.path.join(self.storage_dir, f"{name}_metadata.json")
        with open(path, "w") as f:
            json.dump(data, f, indent=4)
            
    def load_cluster_metadata(self, name: str) -> dict:
        path = os.path.join(self.storage_dir, f"{name}_metadata.json")
        if not os.path.exists(path):
            raise FileNotFoundError(f"No metadata found for {name}")
            
        with open(path, "r") as f:
            return json.load(f)
