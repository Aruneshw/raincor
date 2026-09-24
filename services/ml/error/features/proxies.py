import numpy as np

def calculate_spatial_displacement_proxy(
    nwp_local: float, 
    nwp_neighborhood: np.ndarray, 
    variance_threshold: float = 10.0
) -> float:
    """
    Proxy for Spatial Displacement Error.
    High if the local NWP value differs significantly from the neighborhood maximum.
    This implies the rain was predicted nearby, but missed the exact local grid.
    
    Returns a soft score [0, 1].
    """
    if len(nwp_neighborhood) == 0:
        return 0.0
    neighborhood_max = np.max(nwp_neighborhood)
    diff = abs(neighborhood_max - nwp_local)
    
    # Sigmoid-like scaling
    score = 1.0 / (1.0 + np.exp(-(diff - variance_threshold) / 5.0))
    return float(np.clip(score, 0.0, 1.0))

def calculate_temporal_timing_proxy(
    nwp_t_minus_1: float, 
    nwp_t: float, 
    nwp_t_plus_1: float, 
    gradient_threshold: float = 5.0
) -> float:
    """
    Proxy for Temporal Timing Error.
    High if there is a sharp temporal gradient (e.g. front passing through).
    Sharp gradients increase the likelihood of a timing miss.
    """
    grad_prev = abs(nwp_t - nwp_t_minus_1)
    grad_next = abs(nwp_t_plus_1 - nwp_t)
    max_grad = max(grad_prev, grad_next)
    
    score = 1.0 / (1.0 + np.exp(-(max_grad - gradient_threshold) / 3.0))
    return float(np.clip(score, 0.0, 1.0))

def calculate_intensity_proxy(
    nwp_local: float, 
    climatology_p90: float
) -> float:
    """
    Proxy for Intensity/Distribution Error.
    High if the NWP predicts an extreme value compared to local climatology.
    """
    if climatology_p90 <= 0:
        return 0.0 if nwp_local <= 0 else 1.0
        
    ratio = nwp_local / climatology_p90
    # Center around ratio=1.5
    score = 1.0 / (1.0 + np.exp(-(ratio - 1.5) * 4.0))
    return float(np.clip(score, 0.0, 1.0))

def calculate_orographic_proxy(
    nwp_local: float, 
    elevation_gradient: float, 
    gradient_threshold: float = 50.0
) -> float:
    """
    Proxy for Orographic Bias.
    High if there is significant precipitation and steep local terrain.
    """
    if nwp_local < 1.0:
        return 0.0
        
    score = 1.0 / (1.0 + np.exp(-(elevation_gradient - gradient_threshold) / 15.0))
    return float(np.clip(score, 0.0, 1.0))

def calculate_coastal_proxy(
    nwp_local: float, 
    distance_to_coast_km: float, 
    coast_threshold_km: float = 30.0
) -> float:
    """
    Proxy for Coastal Bias.
    High if there is precipitation near the coast.
    """
    if nwp_local < 1.0:
        return 0.0
        
    # Inverted sigmoid: higher score for lower distance
    score = 1.0 - (1.0 / (1.0 + np.exp(-(distance_to_coast_km - coast_threshold_km) / 5.0)))
    return float(np.clip(score, 0.0, 1.0))

def calculate_convective_proxy(
    nwp_local: float, 
    cape: float = None, 
    extreme_rain_threshold: float = 50.0
) -> float:
    """
    Proxy for Convective Bias.
    High if CAPE is high, or if NWP predicts extremely high localized rain (proxy for convection).
    """
    score = 0.0
    if cape is not None:
        score = 1.0 / (1.0 + np.exp(-(cape - 1500) / 300.0))
    else:
        # Fallback to extreme rain intensity as proxy
        score = 1.0 / (1.0 + np.exp(-(nwp_local - extreme_rain_threshold) / 10.0))
        
    return float(np.clip(score, 0.0, 1.0))

def calculate_moisture_transport_proxy(
    wind_speed: float, 
    nwp_local: float
) -> float:
    """
    Proxy for Moisture Transport Error.
    High if there is strong wind combined with precipitation (often synoptic).
    """
    if nwp_local < 1.0:
        return 0.0
        
    score = 1.0 / (1.0 + np.exp(-(wind_speed - 15.0) / 4.0)) # threshold 15 m/s
    return float(np.clip(score, 0.0, 1.0))

def calculate_physics_residual_proxy(
    nwp_local: float, 
    other_proxy_max: float
) -> float:
    """
    Proxy for Physics/Residual Error.
    Acts as a fallback when NWP predicts rain but no other specific proxy explains it.
    """
    if nwp_local < 1.0:
        return 0.0
        
    # High if other proxies are low
    score = 1.0 - other_proxy_max
    return float(np.clip(score, 0.0, 1.0))
