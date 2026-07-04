from datetime import timedelta
from typing import Optional

from fastapi import APIRouter

from app.services.trainstats_client import (
    fetch_relation_html,
    fetch_train_details_html,
    fetch_train_stops_html,
)
from app.utils.dates import parse_iso_date, validate_range
from app.utils.html_parsing import (
    parse_relation_html,
    parse_train_details_html,
    parse_train_stops_html,
)

router = APIRouter(prefix="/train", tags=["train"])


@router.get("/relations")
def get_relations(origin: str, destination: str):
    html = fetch_relation_html(origin, destination)
    trains = parse_relation_html(html)
    return {
        "origin": origin,
        "destination": destination,
        "count": len(trains),
        "trains": trains,
    }


@router.get("/stops")
def get_train_stops(
    train_number: str,
    travel_date: str,
    origin: str,
):
    """
    Get intermediate stops for a specific train from TrainStats.
    date format: DD_MM_YYYY (e.g. 29_04_2026)
    """
    html = fetch_train_stops_html(train_number, travel_date, origin)
    stops = parse_train_stops_html(html)
    return {
        "train_number": train_number,
        "date": travel_date,
        "origin": origin,
        "total_stops": len(stops),
        "stops": stops,
    }


@router.get("/details")
def get_train_details(
    train_number: str,
    origin: str,
    destination: str,
    departure_time: str,
    arrival_time: str,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
):
    html = fetch_train_details_html(train_number, origin, destination, departure_time, arrival_time)
    records = parse_train_details_html(html, start_date, end_date)

    return {
        "train_number": train_number,
        "origin": origin,
        "destination": destination,
        "start_date": start_date,
        "end_date": end_date,
        "total_records": len(records),
        "daily_records": records,
    }


@router.get("/history")
def get_train_history(
    train_number: str,
    origin: str,
    start_date: str,
    end_date: str,
):
    """
    Get train stops for each day in a date range.
    For each day, queries dettaglioTreno.php.
    """
    s = parse_iso_date(start_date)
    e = parse_iso_date(end_date)
    validate_range(s, e, max_days=30)

    results = []
    current = s
    while current <= e:
        date_str = current.strftime("%d_%m_%Y")
        try:
            html = fetch_train_stops_html(train_number, date_str, origin, force_utf8=True)
            stops = parse_train_stops_html(html)
            if stops:
                results.append({
                    "date": current.isoformat(),
                    "date_italian": date_str,
                    "total_stops": len(stops),
                    "stops": stops,
                })
        except Exception:
            pass
        current += timedelta(days=1)

    return {
        "train_number": train_number,
        "origin": origin,
        "start_date": start_date,
        "end_date": end_date,
        "total_days": len(results),
        "history": results,
    }
