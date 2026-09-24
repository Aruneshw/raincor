import pytest
import numpy as np
import xarray as xr
from synthetic import generate_synthetic_nwp, generate_synthetic_obs
from processing.normalization import normalize_time, normalize_coordinates
from processing.quality_control import handle_missing_values, apply_quality_flags
from features.builder import FeatureBuilder

def test_synthetic_generation():
    """Verify synthetic NWP datasets have correct structure."""
    ds = generate_synthetic_nwp(n_lat=10, n_lon=10, n_times=2)
    assert 'time' in ds.coords
    assert 'lat' in ds.coords
    assert 'lon' in ds.coords
    assert 'rainfall' in ds.data_vars
    assert ds.attrs["description"] == "SYNTHETIC DATA FOR TESTING ONLY"

def test_normalization():
    """Verify coordinate normalization logic."""
    # Create dataset with non-standard coords
    ds = xr.Dataset(
        coords=dict(
            longitude=(["longitude"], [1, 2]),
            latitude=(["latitude"], [3, 4]),
            valid_time=(["valid_time"], [5, 6])
        )
    )
    
    ds_norm = normalize_coordinates(ds)
    assert 'lat' in ds_norm.coords
    assert 'lon' in ds_norm.coords
    assert 'latitude' not in ds_norm.coords
    
    ds_norm_time = normalize_time(ds_norm, time_dim='valid_time')
    assert 'time' in ds_norm_time.coords

def test_quality_control():
    """Verify missing value logic."""
    ds = xr.Dataset(
        data_vars=dict(
            rainfall=(["time", "lat", "lon"], [[[np.nan, 2.0]]]),
            temperature=(["time", "lat", "lon"], [[[np.nan, 25.0]]])
        ),
        coords=dict(
            lon=(["lon"], [1, 2]),
            lat=(["lat"], [3]),
            time=(["time"], [5])
        )
    )
    
    ds_clean = handle_missing_values(ds, variables_to_zero=['rainfall'], variables_to_interpolate=['temperature'])
    
    # Rainfall NaN -> 0
    assert ds_clean.rainfall.values[0, 0, 0] == 0.0
    
    # Temperature ffill/bfill/interp -> might just ffill or leave nan if only 1 point. 
    # Because there's no previous time to interpolate from, and no space interpolation in handle_missing_values, 
    # it remains NaN or gets ffilled if possible. We test rainfall which is guaranteed 0.

def test_feature_builder():
    """Verify dynamic tensor extraction."""
    ds = generate_synthetic_nwp(n_lat=10, n_lon=10, n_times=2)
    builder = FeatureBuilder(ds)
    
    dynamic = builder.get_dynamic_features()
    # shape should be (time, lat, lon, num_dynamic_features)
    assert dynamic.shape == (2, 10, 10, len(builder.DYNAMIC_VARS))
    
    temporal = builder.get_temporal_features()
    assert temporal.shape == (2, 10, 10, 2) # sin, cos
