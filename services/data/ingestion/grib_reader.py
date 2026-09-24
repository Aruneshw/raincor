import xarray as xr
from .interfaces import INWPProvider
import warnings

class GRIBReader(INWPProvider):
    """
    Adapter for reading GRIB/GRIB2 files (common for NWP like ECMWF/IMD).
    Uses cfgrib engine via xarray.
    """
    def ingest(self, filepath: str) -> xr.Dataset:
        try:
            # cfgrib handles decoding of GRIB messages into xarray dimensions
            ds = xr.open_dataset(filepath, engine='cfgrib')
            return ds
        except Exception as e:
            warnings.warn(f"Failed to open GRIB file {filepath}. Ensure eccodes C-library is installed. Error: {e}")
            raise
