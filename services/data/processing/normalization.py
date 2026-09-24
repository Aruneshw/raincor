import xarray as xr
import pandas as pd
import numpy as np

def normalize_time(ds: xr.Dataset, time_dim: str = None) -> xr.Dataset:
    """
    Aligns various timestamp formats to a canonical pandas DatetimeIndex (UTC).
    Attempts to auto-detect the time dimension if not provided.
    """
    if time_dim is None:
        # Guess time dimension
        time_candidates = ['time', 'valid_time', 't', 'date']
        for cand in time_candidates:
            if cand in ds.dims or cand in ds.coords:
                time_dim = cand
                break
                
    if time_dim is None or time_dim not in ds.coords:
        return ds # No time dimension found
        
    # Standardize name to 'time'
    if time_dim != 'time':
        ds = ds.rename({time_dim: 'time'})
        
    # Ensure it's datetime64
    if not np.issubdtype(ds.time.dtype, np.datetime64):
        ds['time'] = pd.to_datetime(ds['time'].values)
        
    return ds

def normalize_coordinates(ds: xr.Dataset) -> xr.Dataset:
    """
    Renames heterogeneous coordinate dimensions to canonical 'lat' and 'lon'.
    """
    rename_map = {}
    
    lat_candidates = ['latitude', 'lat', 'y']
    for cand in lat_candidates:
        if cand in ds.dims or cand in ds.coords:
            rename_map[cand] = 'lat'
            break
            
    lon_candidates = ['longitude', 'lon', 'x']
    for cand in lon_candidates:
        if cand in ds.dims or cand in ds.coords:
            rename_map[cand] = 'lon'
            break
            
    # Avoid renaming if already correct
    rename_map = {k: v for k, v in rename_map.items() if k != v}
    
    if rename_map:
        ds = ds.rename(rename_map)
        
    return ds
