import xarray as xr
from .interfaces import INWPProvider

class NetCDFReader(INWPProvider):
    """
    Adapter for reading generic NetCDF files.
    """
    def ingest(self, filepath: str) -> xr.Dataset:
        # Load via xarray natively
        ds = xr.open_dataset(filepath, engine='netcdf4')
        return ds
