from fastapi import APIRouter, HTTPException

from app.services.trainstats_client import fetch_stations_js, fetch_destination_text
from app.utils.html_parsing import parse_stations_js,parse_destinations_text

router = APIRouter(tags=["stations"])


@router.get("/stations")
def get_stations():
    js_text = fetch_stations_js()
    stations = parse_stations_js(js_text)
    return {
        "count": len(stations),
        "stations": stations,
    }


@router.get("/stations/destinations")
def get_destinations (origin : str):
    text = fetch_destination_text(origin)
    destinations= parse_destinations_text(text)
    if not destinations:
        raise HTTPException(
            status_code= 404,
            detail= f"No routes recorded from '{origin}'."
        )
    return {
        "origin" : origin,
        "destinations" : destinations,
        "count" : len(destinations)
    }


