import xarray as xr
import numpy as np

def handle_missing_values(ds: xr.Dataset, variables_to_zero: list = None, variables_to_interpolate: list = None) -> xr.Dataset:
    """
    Handles missing values (NaNs) in the dataset.
    - variables_to_zero: List of variables where NaN should be 0 (e.g., rainfall)
    - variables_to_interpolate: List of variables to linearly interpolate (e.g., temperature)
    """
    if variables_to_zero:
        for var in variables_to_zero:
            if var in ds.data_vars:
                ds[var] = ds[var].fillna(0.0)
                
    if variables_to_interpolate:
        for var in variables_to_interpolate:
            if var in ds.data_vars:
                # Interpolate along time dimension if present
                if 'time' in ds.dims:
                    ds[var] = ds[var].interpolate_na(dim='time', method='linear')
                else:
                    # Fallback to simple forward fill
                    ds[var] = ds[var].ffill(dim=list(ds.dims)[0])
                    
    return ds

def apply_quality_flags(ds: xr.Dataset, qc_var: str, threshold: int, data_vars: list) -> xr.Dataset:
    """
    Applies quality control flags. Masks out data variables where the quality
    flag exceeds the threshold (e.g., QC=1 is good, QC=2 is bad).
    """
    if qc_var not in ds.data_vars:
        return ds # No QC variable present
        
    mask = ds[qc_var] <= threshold
    
    for var in data_vars:
        if var in ds.data_vars:
            ds[var] = ds[var].where(mask)
            
    return ds
