import xarray as xr
import numpy as np

class FeatureBuilder:
    """
    Extracts structured Dynamic, Static, and Temporal feature tensors 
    from canonicalized xarray Datasets.
    """
    
    DYNAMIC_VARS = [
        'rainfall', 'temperature', 'humidity', 'pressure', 
        'wind_u', 'wind_v', 'geopotential', 'vertical_velocity', 'CAPE'
    ]
    
    STATIC_VARS = [
        'elevation', 'slope', 'aspect', 'distance_to_coast', 
        'land_cover', 'terrain_roughness'
    ]
    
    def __init__(self, ds: xr.Dataset):
        self.ds = ds
        
    def get_dynamic_features(self) -> np.ndarray:
        """
        Extracts dynamic variables.
        Shape typically: (time, lat, lon, features)
        """
        features = []
        base_shape = self.ds[list(self.ds.data_vars)[0]].shape
        
        for var in self.DYNAMIC_VARS:
            if var in self.ds.data_vars:
                features.append(self.ds[var].values)
            else:
                # Fill with zeros if missing
                features.append(np.zeros(base_shape))
                
        # Stack along feature dimension (last axis)
        return np.stack(features, axis=-1)

    def get_static_features(self) -> np.ndarray:
        """
        Extracts static geographical features.
        Shape typically: (lat, lon, features)
        """
        features = []
        for var in self.STATIC_VARS:
            if var in self.ds.data_vars:
                # Assuming static vars don't have a time dimension, or taking first index if they do
                val = self.ds[var].values
                if len(val.shape) == 3: # (time, lat, lon)
                    val = val[0]
                features.append(val)
            else:
                # Extract lat/lon shape
                shape = (self.ds.dims.get('lat', 1), self.ds.dims.get('lon', 1))
                features.append(np.zeros(shape))
                
        return np.stack(features, axis=-1)

    def get_temporal_features(self) -> np.ndarray:
        """
        Extracts temporal embeddings (month, day of year).
        Shape typically: (time, lat, lon, 2)
        """
        if 'time' not in self.ds.coords:
            raise ValueError("Dataset must have 'time' coordinate for temporal features.")
            
        time_vals = self.ds['time'].dt
        
        # Simple cyclic encoding for month
        month_sin = np.sin(2 * np.pi * time_vals.month / 12.0)
        month_cos = np.cos(2 * np.pi * time_vals.month / 12.0)
        
        # Broadcast to spatial dims if needed
        # Often these are just (time, features), but for spatial networks it can be expanded
        shape = (self.ds.dims.get('time', 1), self.ds.dims.get('lat', 1), self.ds.dims.get('lon', 1))
        
        month_sin_grid = np.broadcast_to(month_sin.values[:, None, None], shape)
        month_cos_grid = np.broadcast_to(month_cos.values[:, None, None], shape)
        
        return np.stack([month_sin_grid, month_cos_grid], axis=-1)
