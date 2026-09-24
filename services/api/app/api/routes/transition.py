from fastapi import APIRouter
from ...services.met_service import met_service
from ..schemas.transition import TransitionResponse

router = APIRouter()

@router.get("", response_model=TransitionResponse)
async def get_transition():
    """
    Returns spatial transition overview and NWP lag detection hotspots.
    """
    return met_service.get_transitions()

@router.get("/monitor", response_model=TransitionResponse)
async def get_transition_monitor():
    """
    Returns transition monitor status and priority hotspots.
    """
    return met_service.get_transitions()

@router.get("/map")
async def get_transition_map():
    """
    Returns transition state map data with transition probabilities and targets.
    """
    forecast = met_service.get_forecast()
    trans_cells = [
        {
            "id": g.id,
            "lat": g.lat,
            "lon": g.lon,
            "state": g.state,
            "district": g.district,
            "currentRegime": g.regime,
            "targetRegime": g.transitionTarget,
            "probability": g.transitionProbability or 0.0,
            "isTransitioning": g.isTransitioning,
            "lagHours": g.nwpRegimeLagHours or 0,
        }
        for g in forecast.grids if g.isTransitioning
    ]
    return {
        "timestamp": forecast.timestamp,
        "totalTransitioning": len(trans_cells),
        "cells": trans_cells
    }
