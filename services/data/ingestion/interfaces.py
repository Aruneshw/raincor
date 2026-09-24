from abc import ABC, abstractmethod
import xarray as xr

class INWPProvider(ABC):
    """
    Interface for Numerical Weather Prediction (NWP) models (e.g., GFS, ECMWF, IMD).
    Must return a canonical xarray Dataset.
    """
    @abstractmethod
    def ingest(self, filepath: str) -> xr.Dataset:
        pass

class IObservationProvider(ABC):
    """
    Interface for point or gridded observations (e.g., IMD AWS/ARG or IMD gridded rainfall).
    Must return a canonical xarray Dataset.
    """
    @abstractmethod
    def ingest(self, filepath: str) -> xr.Dataset:
        pass

class IStaticDataProvider(ABC):
    """
    Interface for static geographical or terrain data (e.g., elevation, land cover).
    Must return a canonical xarray Dataset.
    """
    @abstractmethod
    def ingest(self, filepath: str) -> xr.Dataset:
        pass
