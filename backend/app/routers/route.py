from typing import Optional

from fastapi import APIRouter, HTTPException
from datetime import timedelta
from app.services.trainstats_client import fetch_relation_html, fetch_train_details_html, fetch_train_stops_html
from app.utils.dates import parse_iso_date, validate_range
from app.utils.html_parsing import parse_relation_html, parse_train_details_html, parse_train_stops_html
from app.utils.stats import aggregate_route_stats, aggregate_station_stats, trim_stops_to_segment

router = APIRouter(prefix="/route", tags=["route"])


@router.get("/stats")
def get_route_stats(
    origin: str,
    destination: str,
    start_date: str,
    end_date: str,
    train_number: Optional[str] = None,
    on_time_threshold_minutes: int = 5,
    include_stations: bool = False,
):
    s = parse_iso_date(start_date)
    e = parse_iso_date(end_date)
    validate_range(s, e)

    relation_html = fetch_relation_html(origin, destination)
    trains = parse_relation_html(relation_html)
    if not trains:
        raise HTTPException(
            status_code=404,
            detail=f"No trains found between '{origin}' and '{destination}'.",
        )

    if train_number:
        trains = [t for t in trains if t.get("train_number") == train_number]
        if not trains:
            raise HTTPException(
                status_code=404,
                detail=f"Train '{train_number}' was not found between '{origin}' and '{destination}'.",
            )

    all_records = []
    by_train = []
    for t in trains:
        try:
            details_html = fetch_train_details_html(
                t["train_number"],
                origin,
                destination,
                t["origin_time"],
                t["arrival_time"],
            )
            records = parse_train_details_html(details_html, start_date, end_date)
        except HTTPException:
            raise
        except Exception:
            records = []

        train_stats = aggregate_route_stats(records, on_time_threshold_minutes)
        if train_stats["total_records"] > 0:
            by_train.append({
            "train_number": t.get("train_number"),
            "category": t.get("category"),
            **train_stats,
        })
        all_records.extend(records)

    overall = aggregate_route_stats(all_records, on_time_threshold_minutes)

    all_stops = []
    if include_stations:
        active_train_numbers = list(dict.fromkeys(entry["train_number"] for entry in by_train))
        current = s
        while current <= e:
            date_str = current.strftime("%d_%m_%Y")
            for train_num in active_train_numbers:
                try:
                    stops_html = fetch_train_stops_html(train_num, date_str, origin, force_utf8=True)
                    stops = parse_train_stops_html(stops_html)
                    stops = trim_stops_to_segment(stops, origin, destination)
                    all_stops.extend(stops)
                except Exception:
                    pass
            current += timedelta(days=1)

    by_station = aggregate_station_stats(all_stops, on_time_threshold_minutes) if include_stations else []

    return {
        "origin": origin,
        "destination": destination,
        "start_date": start_date,
        "end_date": end_date,
        "trains_analyzed": len(trains),
        "overall": overall,
        "by_train": by_train,
        "by_station": by_station,
    }