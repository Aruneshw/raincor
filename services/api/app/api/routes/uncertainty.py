from fastapi import APIRouter
from ...services.met_service import met_service
from ..schemas.uncertainty import UncertaintyResponse

router = APIRouter()

@router.get("", response_model=UncertaintyResponse)
async def get_uncertainty():
    """
    Returns domain-wide quantile uncertainty and regional spread metrics.
    """
    return met_service.get_uncertainty()

@router.get("/quantiles", response_model=UncertaintyResponse)
async def get_uncertainty_quantiles():
    """
    Returns uncertainty response including P10-P50-P90 quantiles and Shannon entropy.
    """
    return met_service.get_uncertainty()

@router.get("/map")
async def get_uncertainty_map():
    """
    Returns uncertainty map data with P10/P90 bounds, spread, and entropy.
    """
    forecast = met_service.get_forecast()
    unc_cells = [
        {
            "id": g.id,
            "lat": g.lat,
            "lon": g.lon,
            "state": g.state,
            "district": g.district,
            "p10Mm": g.p10Mm,
            "p50Mm": g.p50Mm,
            "p90Mm": g.p90Mm,
            "spreadMm": round(g.p90Mm - g.p10Mm, 1),
            "entropy": g.entropy,
            "confidence": g.confidence,
        }
        for g in forecast.grids
    ]
    return {
        "timestamp": forecast.timestamp,
        "totalGrids": len(unc_cells),
        "cells": unc_cells
    }
