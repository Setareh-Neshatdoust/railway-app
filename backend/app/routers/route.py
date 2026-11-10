from typing import Optional, Any, Dict
from fastapi import APIRouter, HTTPException
from collections import Counter
from concurrent.futures import ThreadPoolExecutor
from datetime import timedelta
from app.services.trainstats_client import fetch_relation_html, fetch_train_details_html, fetch_train_stops_html, fetch_stops_between_text
from app.utils.dates import parse_iso_date, validate_range
from app.utils.html_parsing import parse_relation_html, parse_train_details_html, parse_train_stops_html, parse_stops_between_json
from app.utils.stats import aggregate_route_stats, aggregate_station_stats, trim_stops_to_segment
from app.services.station_names import stop_station_name
from app.services.direct_train import direct_train_status
from app.utils.stats import aggregate_by_day, aggregate_route_stats, aggregate_station_stats, trim_stops_to_segment

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
    # TrainStats can list the same train twice, e.g. once more for a day with a different
    # timetable: that day then comes back from both entries. Keep one record per train and day
    records_by_train: Dict[str, Dict[str, Dict[str, Any]]] = {}
    categories: Dict[str, Optional[str]] = {}
    unanswered_trains = []  # trains whose daily records TrainStats did not send
    for t in trains:
        number = t["train_number"]
        try:
            details_html = fetch_train_details_html(
                number,
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
            unanswered_trains.append(number)

        days = records_by_train.setdefault(number, {})
        for r in records:
            days.setdefault(r.get("date"), r)
        categories.setdefault(number, t.get("category"))

    all_records = []
    by_train = []
    for number, days in records_by_train.items():
        records = list(days.values())
        train_stats = aggregate_route_stats(records, on_time_threshold_minutes)
        if train_stats["total_records"] > 0:
            by_train.append({
                "train_number": number,
                "category": categories[number],
                **train_stats,
            })
        all_records.extend(records)
    overall = aggregate_route_stats(all_records, on_time_threshold_minutes)

    if overall["total_records"] == 0 and unanswered_trains:
        raise HTTPException(status_code=502, detail="TrainStats, the data source, did not answer. Please try again in a few minutes.")
        
    if overall["total_records"] == 0:
        raise HTTPException(
            status_code=404,
            detail=f"No train between '{origin}' and '{destination}' was recorded "
                   f"from {s.strftime('%d/%m/%Y')} to {e.strftime('%d/%m/%Y')}.",
        )

    all_stops = []
    unanswered_stop_tables = 0
    canonical_origin = trains[0]["origin"]
    canonical_destination = trains[0]["destination"]
    if include_stations:
        # Stop lists spell some stations differently (TORINO P.NUOVA -> TORINO PORTA NUOVA)
        first_day = s.strftime("%d_%m_%Y")
        stops_origin = stop_station_name(canonical_origin, first_day)
        stops_destination = stop_station_name(canonical_destination, first_day)
        # Only the days each train really ran this route: the same trips as the summary.
        # Downloaded a few at a time instead of one after the other
        trips = [(number, day) for number, days in records_by_train.items() for day in days if day]

        def stops_of(trip):
            number, day = trip  # day as TrainStats writes it, "dd/mm/yyyy"
            try:
                html = fetch_train_stops_html(number, day.replace("/", "_"), stops_origin, force_utf8=True)
                return trim_stops_to_segment(parse_train_stops_html(html), stops_origin, stops_destination)
            except Exception:
                return None  # TrainStats did not answer

        with ThreadPoolExecutor(max_workers=6) as pool:
            for stops in pool.map(stops_of, trips):
                if stops is None:
                    unanswered_stop_tables += 1
                else:
                    all_stops.extend(stops)


    by_station = aggregate_station_stats(all_stops, on_time_threshold_minutes) if include_stations else []

    return {
        "origin": origin,
        "destination": destination,
        "start_date": start_date,
        "end_date": end_date,
        "trains_analyzed": len(by_train),
        "overall": overall,
        "by_train": by_train,
        "by_station": by_station,
        "by_day": aggregate_by_day(all_records, on_time_threshold_minutes),
        "trains_without_answer": sorted(set(unanswered_trains)),
        "stop_tables_without_answer": unanswered_stop_tables,
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

    # One request per day, a few at a time
    days = [s + timedelta(days=i) for i in range((e - s).days + 1)]

    def records_of(day):
        try:         
            text = fetch_stops_between_text(origin, destination, day.strftime("%d_%m_%Y"))
            records = parse_stops_between_json(text, origin, destination)
            for record in records:
                record["date"] = day.strftime("%d/%m/%Y")  # the day of the request, for the chart by day
            return records
            
        except Exception:
            return None  # TrainStats did not answer

    all_records = []
    unanswered_days = []
    with ThreadPoolExecutor(max_workers=6) as pool:
        for day, records in zip(days, pool.map(records_of, days)):
            if records is None:
                unanswered_days.append(day.isoformat())
            else:
                all_records.extend(records)

    if not all_records and unanswered_days:
        raise HTTPException(status_code=502, detail="TrainStats, the data source, did not answer. Please try again in a few minutes.")

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
        # A train can start or end at different stations on different days (9519: NAPOLI CENTRALE or SALERNO):
        # show where it went most often, and list the others
        origins = Counter(r["train_origin"] for r in records)
        destinations = Counter(r["train_destination"] for r in records)
        usual_destination = destinations.most_common(1)[0][0]
        by_train.append({
            "train_number": train_number,
            "category": records[0]["category"],
            "train_origin": origins.most_common(1)[0][0],
            "train_destination": usual_destination,
            "other_destinations": [name for name, _ in destinations.most_common() if name != usual_destination],
            **aggregate_route_stats(records, on_time_threshold_minutes),
        })

    return {
        "origin": origin,
        "destination": destination,
        "start_date": start_date,
        "end_date": end_date,
        "overall": aggregate_route_stats(all_records, on_time_threshold_minutes),
        "by_train": by_train,
        "days_without_answer": unanswered_days,
        "by_day": aggregate_by_day(all_records, on_time_threshold_minutes),
    }

@router.get("/direct-train")
def get_direct_train(origin: str, destination: str):
    """
    Is the relation still served, and do trains pass through both stations?
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
        "relation": result["relation"],
        "last_seen": result["last_seen"].isoformat() if result["last_seen"] else None,
        "count": result["count"],
        "through_last_seen": result["through_last_seen"].isoformat() if result["through_last_seen"] else None,
    }