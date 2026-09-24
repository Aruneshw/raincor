import xarray as xr
import numpy as np
from abc import ABC, abstractmethod

class IRegridder(ABC):
    """
    Interface for regridding datasets to the canonical RainMind grid.
    """
    @abstractmethod
    def regrid(self, ds: xr.Dataset, target_lats: np.ndarray, target_lons: np.ndarray) -> xr.Dataset:
        pass

class XarrayBilinearRegridder(IRegridder):
    """
    Basic bilinear interpolation using xarray's native interp function.
    """
    def regrid(self, ds: xr.Dataset, target_lats: np.ndarray, target_lons: np.ndarray) -> xr.Dataset:
        # Check if dimensions exist
        if 'lat' not in ds.dims or 'lon' not in ds.dims:
            raise ValueError("Dataset must have 'lat' and 'lon' dimensions for regridding.")
            
        return ds.interp(lat=target_lats, lon=target_lons, method='linear', kwargs={"fill_value": "extrapolate"})
