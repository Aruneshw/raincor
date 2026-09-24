from pydantic import BaseModel, Field

class GridRecord(BaseModel):
    """Canonical representation of a single grid cell."""
    grid_id: str = Field(..., description="Stable unique identifier for the grid cell (e.g., 'G_0_0')")
    lat: float = Field(..., description="Latitude of the grid cell center")
    lon: float = Field(..., description="Longitude of the grid cell center")
    i: int = Field(..., description="Latitude index (0 to N_lat - 1)")
    j: int = Field(..., description="Longitude index (0 to N_lon - 1)")
    
    # Optional extended properties
    is_land: bool = Field(True, description="True if the grid cell is over land, False if ocean")
    elevation_m: float = Field(0.0, description="Mean elevation in meters (0 for ocean)")
    district_id: str | None = Field(None, description="Optional ID of the primary intersecting district")

class GridMetadata(BaseModel):
    """Metadata describing the entire grid layout."""
    version: str = "1.0.0"
    n_lat: int = 135
    n_lon: int = 129
    resolution_deg: float = 0.25
    lat_min: float
    lon_min: float
    total_cells: int
    cells: list[GridRecord]
