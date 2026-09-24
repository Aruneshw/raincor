import xarray as xr
import pandas as pd
from .interfaces import IObservationProvider

class TabularReader(IObservationProvider):
    """
    Adapter for reading point observations (CSV/Parquet) and converting them
    into a canonical xarray Dataset.
    Assumes standard columns like 'lat', 'lon', 'time', and variables.
    """
    def ingest(self, filepath: str) -> xr.Dataset:
        if filepath.endswith('.csv'):
            df = pd.read_csv(filepath)
        elif filepath.endswith('.parquet'):
            df = pd.read_parquet(filepath)
        else:
            raise ValueError("Unsupported tabular format. Expected .csv or .parquet")
            
        # Ensure mandatory columns exist
        required_cols = ['time', 'lat', 'lon']
        for col in required_cols:
            if col not in df.columns:
                raise ValueError(f"Tabular data must contain '{col}' column.")
                
        # Convert time to datetime if it's not already
        df['time'] = pd.to_datetime(df['time'])
        
        # Set multi-index and convert to xarray
        df = df.set_index(['time', 'lat', 'lon'])
        ds = xr.Dataset.from_dataframe(df)
        
        return ds
