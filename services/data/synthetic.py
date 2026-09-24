import xarray as xr
import numpy as np
import pandas as pd

def generate_synthetic_nwp(n_lat: int = 135, n_lon: int = 129, n_times: int = 4) -> xr.Dataset:
    """
    Generates a realistic (but completely synthetic) NWP dataset for testing.
    Strictly labeled as synthetic in the attributes.
    """
    lats = np.linspace(6.5, 40.0, n_lat)
    lons = np.linspace(66.5, 98.5, n_lon)
    times = pd.date_range("2024-01-01", periods=n_times, freq="6h")
    
    # Random synthetic data
    shape = (n_times, n_lat, n_lon)
    rainfall = np.random.exponential(scale=2.0, size=shape)
    temperature = np.random.normal(loc=25.0, scale=5.0, size=shape)
    
    ds = xr.Dataset(
        data_vars=dict(
            rainfall=(["time", "lat", "lon"], rainfall),
            temperature=(["time", "lat", "lon"], temperature),
        ),
        coords=dict(
            lon=(["lon"], lons),
            lat=(["lat"], lats),
            time=(["time"], times),
        ),
        attrs=dict(description="SYNTHETIC DATA FOR TESTING ONLY", provider="RainMind Synthetic Generator")
    )
    return ds

def generate_synthetic_obs(n_stations: int = 100, n_times: int = 24) -> xr.Dataset:
    """
    Generates synthetic point observations (e.g., AWS/ARG networks).
    """
    # Random station locations in India bounding box
    lats = np.random.uniform(6.5, 40.0, n_stations)
    lons = np.random.uniform(66.5, 98.5, n_stations)
    times = pd.date_range("2024-01-01", periods=n_times, freq="1h")
    
    # Create multi-index dataframe style data to convert to xarray
    time_idx = np.repeat(times, n_stations)
    lat_idx = np.tile(lats, n_times)
    lon_idx = np.tile(lons, n_times)
    
    rainfall = np.random.exponential(scale=1.5, size=n_stations * n_times)
    qc_flag = np.random.choice([1, 2, 9], size=n_stations * n_times, p=[0.9, 0.05, 0.05])
    
    df = pd.DataFrame({
        'time': time_idx,
        'lat': lat_idx,
        'lon': lon_idx,
        'rainfall': rainfall,
        'qc_flag': qc_flag
    })
    
    df = df.set_index(['time', 'lat', 'lon'])
    ds = xr.Dataset.from_dataframe(df)
    ds.attrs["description"] = "SYNTHETIC OBS DATA FOR TESTING ONLY"
    
    return ds
