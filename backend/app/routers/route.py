from typing import Optional

from fastapi import APIRouter, HTTPException
from datetime import timedelta
from app.services.trainstats_client import fetch_relation_html, fetch_train_details_html, fetch_train_stops_html, fetch_stops_between_text
from app.utils.dates import parse_iso_date, validate_range
from app.utils.html_parsing import parse_relation_html, parse_train_details_html, parse_train_stops_html, parse_stops_between_json
from app.utils.stats import aggregate_route_stats, aggregate_station_stats, trim_stops_to_segment
from app.services.station_names import stop_station_name
from app.services.direct_train import direct_train_status

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
        
    if overall["total_records"] == 0:
        raise HTTPException(
            status_code=404,
            detail=f"No train between '{origin}' and '{destination}' was recorded "
                   f"from {s.strftime('%d/%m/%Y')} to {e.strftime('%d/%m/%Y')}.",
        )

    all_stops = []
    canonical_origin = trains[0]["origin"]
    canonical_destination = trains[0]["destination"]
    if include_stations:
        # Stop lists spell some stations differently (TORINO P.NUOVA -> TORINO PORTA NUOVA)
        first_day = s.strftime("%d_%m_%Y")
        stops_origin = stop_station_name(canonical_origin, first_day)
        stops_destination = stop_station_name(canonical_destination, first_day)
        active_train_numbers = list(dict.fromkeys(entry["train_number"] for entry in by_train))
        current = s
        while current <= e:
            date_str = current.strftime("%d_%m_%Y")
            for train_num in active_train_numbers:
                try:
                    stops_html = fetch_train_stops_html(train_num, date_str, stops_origin, force_utf8=True)
                    stops = parse_train_stops_html(stops_html)
                    stops = trim_stops_to_segment(stops, stops_origin, stops_destination)
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

@router.get("/segment")
def get_segment_stats(
    origin: str,
    destination: str,
    start_date: str,
    end_date: str,
    on_time_threshold_minutes: int = 5,
):
    """
    Same method as TrainStats' "Cerca per fermate": every train that stopped at
    origin and then at destination, on each day of the range. The two stations
    can be any stops, also intermediate ones (e.g. ALBA -> BRA).
    """
    s = parse_iso_date(start_date)
    e = parse_iso_date(end_date)
    validate_range(s, e)

    # "Cerca per fermate" uses the stop-list spelling (TORINO P.NUOVA -> TORINO PORTA NUOVA)
    first_day = s.strftime("%d_%m_%Y")
    origin = stop_station_name(origin, first_day)
    destination = stop_station_name(destination, first_day)

    all_records = []
    current = s
    while current <= e:
        try:
            text = fetch_stops_between_text(origin, destination, current.strftime("%d_%m_%Y"))
            all_records.extend(parse_stops_between_json(text, origin, destination))
        except Exception:
            pass
        current += timedelta(days=1)

    if not all_records:
        raise HTTPException(
            status_code=404,
            detail=f"No trains found stopping at '{origin}' and then '{destination}' in this period.",
        )

    records_by_train = {}
    for record in all_records:
        records_by_train.setdefault(record["train_number"], []).append(record)

    by_train = []
    for train_number, records in records_by_train.items():
        by_train.append({
            "train_number": train_number,
            "category": records[0]["category"],
            "train_origin": records[0]["train_origin"],
            "train_destination": records[0]["train_destination"],
            **aggregate_route_stats(records, on_time_threshold_minutes),
        })

    return {
        "origin": origin,
        "destination": destination,
        "start_date": start_date,
        "end_date": end_date,
        "overall": aggregate_route_stats(all_records, on_time_threshold_minutes),
        "by_train": by_train,
    }

@router.get("/direct-train")
def get_direct_train(origin: str, destination: str):
    """
    Does a direct train run between origin and destination today?
    The approved rule (thesis, Section 3.4.5), answered from memory for one day.
    """
    try:
        result = direct_train_status(origin, destination)
    except Exception:
        raise HTTPException(
            status_code=502,
            detail="TrainStats did not answer the direct-train check. Please try again later.",
        )
    return {
        "origin": origin,
        "destination": destination,
        "status": result["status"],
        "last_seen": result["last_seen"].isoformat() if result["last_seen"] else None,
    }