from fastapi import APIRouter

from app.services.trainstats_client import fetch_stations_js
from app.utils.html_parsing import parse_stations_js

router = APIRouter(tags=["stations"])


@router.get("/stations")
def get_stations():
    js_text = fetch_stations_js()
    stations = parse_stations_js(js_text)
    return {
        "count": len(stations),
        "stations": stations,
    }