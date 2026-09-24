import numpy as np

# Constants
EARTH_RADIUS_KM = 6371.0

def lat_lon_spacing(coords: np.ndarray) -> np.ndarray:
    """
    Formulas 1 & 2: Latitude and Longitude spacing.
    Returns the differences between consecutive coordinates.
    """
    return np.diff(coords)

def approx_cell_size_km(dlat: float, dlon: float, lat: np.ndarray) -> tuple[float, np.ndarray]:
    """
    Formulas 3 & 4: Approximate physical cell size in km.
    dy ≈ R * dlat * (pi / 180)
    dx ≈ R * cos(lat) * dlon * (pi / 180)
    """
    dy = EARTH_RADIUS_KM * dlat * (np.pi / 180.0)
    lat_rad = np.radians(lat)
    dx = EARTH_RADIUS_KM * np.cos(lat_rad) * dlon * (np.pi / 180.0)
    return dy, dx

def cell_area_km2(dlat: float, dlon: float, lat: np.ndarray) -> np.ndarray:
    """
    Formula 5: Cell area weighting for grid aggregation.
    A ≈ R^2 * (pi/180)^2 * dlat * dlon * cos(lat)
    """
    lat_rad = np.radians(lat)
    return (EARTH_RADIUS_KM ** 2) * ((np.pi / 180.0) ** 2) * dlat * dlon * np.cos(lat_rad)

def grid_index_1d(i: np.ndarray, j: np.ndarray, n_lon: int) -> np.ndarray:
    """
    Formula 7: Flatten 2D grid index to 1D.
    g = i * N_lon + j
    """
    return i * n_lon + j

def lead_time_hours(t_valid: np.ndarray, t_init: np.ndarray) -> np.ndarray:
    """
    Formula 8: Forecast lead time in hours from UNIX timestamps.
    """
    return (t_valid - t_init) / 3600.0

def great_circle_distance(lat1: np.ndarray, lon1: np.ndarray, lat2: np.ndarray, lon2: np.ndarray) -> np.ndarray:
    """
    Formula 9: Haversine / Great-circle distance between grid centers in km.
    """
    lat1_rad, lon1_rad = np.radians(lat1), np.radians(lon1)
    lat2_rad, lon2_rad = np.radians(lat2), np.radians(lon2)
    
    dlat = lat2_rad - lat1_rad
    dlon = lon2_rad - lon1_rad
    
    a = np.sin(dlat / 2.0)**2 + np.cos(lat1_rad) * np.cos(lat2_rad) * np.sin(dlon / 2.0)**2
    # Ensure numerical stability
    a = np.clip(a, 0.0, 1.0)
    
    return 2.0 * EARTH_RADIUS_KM * np.arcsin(np.sqrt(a))

def bearing(lat1: np.ndarray, lon1: np.ndarray, lat2: np.ndarray, lon2: np.ndarray) -> np.ndarray:
    """
    Formula 10: Bearing (direction) from grid 1 to grid 2 in radians.
    """
    lat1_rad, lon1_rad = np.radians(lat1), np.radians(lon1)
    lat2_rad, lon2_rad = np.radians(lat2), np.radians(lon2)
    
    dlon = lon2_rad - lon1_rad
    
    y = np.sin(dlon) * np.cos(lat2_rad)
    x = np.cos(lat1_rad) * np.sin(lat2_rad) - np.sin(lat1_rad) * np.cos(lat2_rad) * np.cos(dlon)
    
    return np.arctan2(y, x)
