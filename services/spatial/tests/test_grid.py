import pytest
import numpy as np
from grid.engine import SpatialGrid
from neighbourhood.lookup import NeighbourhoodEngine
from masks.land_ocean import LandOceanMask

@pytest.fixture
def base_grid():
    return SpatialGrid()

def test_grid_dimensions(base_grid):
    """Verifies the base India grid dimensions."""
    assert base_grid.n_lat == 135
    assert base_grid.n_lon == 129
    assert len(base_grid._id_to_record) == 135 * 129

def test_stable_ids(base_grid):
    """Verifies that G_0_0 and max G_i_j are stable and exist."""
    record_0_0 = base_grid._id_to_record["G_0_0"]
    assert record_0_0.i == 0
    assert record_0_0.j == 0
    assert record_0_0.lat == base_grid.lat_min
    assert record_0_0.lon == base_grid.lon_min
    
    max_id = f"G_{base_grid.n_lat-1}_{base_grid.n_lon-1}"
    record_max = base_grid._id_to_record[max_id]
    assert record_max.i == base_grid.n_lat - 1
    assert record_max.j == base_grid.n_lon - 1

def test_coordinate_lookup(base_grid):
    """Verifies lat/lon to nearest Grid ID logic."""
    # Lookup exactly at a point
    lat, lon = base_grid.id_to_coords("G_10_10")
    grid_id = base_grid.coords_to_nearest_grid(lat, lon)
    assert grid_id == "G_10_10"
    
    # Lookup slightly offset (should round to G_10_10)
    grid_id_offset = base_grid.coords_to_nearest_grid(lat + 0.1, lon + 0.1)
    assert grid_id_offset == "G_10_10"

def test_neighbour_consistency(base_grid):
    """Verifies the 3x3 and 5x5 index selection logic."""
    engine = NeighbourhoodEngine(base_grid)
    
    # Test center point
    n3x3 = engine.get_3x3("G_10_10")
    assert len(n3x3) == 9
    assert "G_9_9" in n3x3
    assert "G_11_11" in n3x3
    assert "G_10_10" in n3x3
    
    n5x5 = engine.get_5x5("G_10_10")
    assert len(n5x5) == 25
    assert "G_8_8" in n5x5
    
    # Test boundary point (corner)
    n3x3_corner = engine.get_3x3("G_0_0")
    assert len(n3x3_corner) == 4 # Only (0,0), (0,1), (1,0), (1,1)

def test_mask_handling(base_grid):
    """Verifies that synthetic masks operate correctly."""
    masker = LandOceanMask(base_grid)
    masker.apply_synthetic_mask()
    
    # Check that a point deep inland is land
    # Given the heuristic (lat < 15, lon > 85 is ocean)
    inland_id = base_grid.coords_to_nearest_grid(20.0, 75.0)
    assert base_grid._id_to_record[inland_id].is_land == True
    
    ocean_id = base_grid.coords_to_nearest_grid(10.0, 90.0)
    assert base_grid._id_to_record[ocean_id].is_land == False
