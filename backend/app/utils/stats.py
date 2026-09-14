import re
from typing import Any, Dict, List, Optional

CANCELLATION_KEYWORDS = ("soppress", "cancellat")
_DELAY_NUMBER_RE = re.compile(r"-?\d+")

def is_cancelled(record: Dict[str, Any]) -> bool:
    """
    A daily record is treated as cancelled if any of its delay/time fields
    contain one of the known TrainStats cancellation markers.
    """
    fields = (
        record.get("departure_delay"),
        record.get("arrival_delay"),
        record.get("status"),
        record.get("variations"),
    )
    text = " ".join(f for f in fields if f).lower()
    return any(keyword in text for keyword in CANCELLATION_KEYWORDS)

def parse_delay_minutes(value: Optional[str]) -> Optional[int]:
    """
    Extracts a delay in minutes from a TrainStats delay cell. 
    Returns None if no numeric delay could be parsed
    (e.g. empty cell, cancellation marker, or unexpected format) so the
    caller can exclude it from averages rather than silently treating it
    as zero delay.
    """
    if not value:
        return None
    match = _DELAY_NUMBER_RE.search(value)
    if not match:
        return None
    return int(match.group())

def aggregate_route_stats(
    records: List[Dict[str, Any]],
    on_time_threshold_minutes: int,
) -> Dict[str, Any]:
    """
    Aggregates a list of daily records (as returned by
    parse_train_details_html) into route/train-level statistics:
    average delay, cancellation rate, and on-time percentage.

    On-time percentage is based on arrival_delay, since arrival
    punctuality is what matters most to passengers.
    """
    total = len(records)
    cancelled = [r for r in records if is_cancelled(r)]
    valid = [r for r in records if not is_cancelled(r)]

    departure_delays = [d for r in valid if (d := parse_delay_minutes(r.get("departure_delay"))) is not None]
    arrival_delays = [d for r in valid if (d := parse_delay_minutes(r.get("arrival_delay"))) is not None]
    on_time = [d for d in arrival_delays if d <= on_time_threshold_minutes]

    return {
        "total_records": total,
        "cancelled_count": len(cancelled),
        "cancellation_rate_pct": round(len(cancelled) / total * 100, 2) if total else None,
        "avg_departure_delay_min": round(sum(departure_delays) / len(departure_delays), 2) if departure_delays else None,
        "avg_arrival_delay_min": round(sum(arrival_delays) / len(arrival_delays), 2) if arrival_delays else None,
        "on_time_percentage": round(len(on_time) / len(arrival_delays) * 100, 2) if arrival_delays else None,
        "on_time_threshold_minutes": on_time_threshold_minutes,
    }
"""
Analyzing also intemediate stations not only origin and destination
"""
def aggregate_station_stats(
    stops: List[Dict[str, Any]],
    on_time_threshold_minutes: int,
) -> List[Dict[str, Any]]:
    """
    Groups a flat list of stop records (as returned by parse_train_stops_html,
    collected across multiple days and/or trains) by station name, and
    computes average delay and on-time percentage for each station.
    """
    by_station: Dict[str, List[Dict[str, Any]]] = {}
    for stop in stops:
        name = stop.get("station")
        if not name:
            continue
        by_station.setdefault(name, []).append(stop)

    results = []
    for name, station_stops in by_station.items():
        arrival_delays = [d for s in station_stops if (d := parse_delay_minutes(s.get("arrival_delay"))) is not None]
        departure_delays = [d for s in station_stops if (d := parse_delay_minutes(s.get("departure_delay"))) is not None]
        on_time = [d for d in arrival_delays if d <= on_time_threshold_minutes]

        results.append({
            "station": name,
            "stop_number": station_stops[0].get("stop_number"),
            "days_checked": len(station_stops),
            "days_with_data": len(arrival_delays),
            "avg_arrival_delay_min": round(sum(arrival_delays) / len(arrival_delays), 2) if arrival_delays else None,
            "avg_departure_delay_min": round(sum(departure_delays) / len(departure_delays), 2) if departure_delays else None,
            "on_time_percentage": round(len(on_time) / len(arrival_delays) * 100, 2) if arrival_delays else None,
        })

    results.sort(key=lambda r: int(r["stop_number"]) if r["stop_number"] and r["stop_number"].isdigit() else 999)
    return results
def trim_stops_to_segment(
    stops: List[Dict[str, Any]],
    origin: str,
    destination: str,
) -> List[Dict[str, Any]]:
    """
    A train's full stop list can extend beyond the requested route (e.g. a
    long-distance train continuing past the destination to further cities,
    or starting its journey before the requested origin). This trims the
    list down to just the segment between origin and destination
    (inclusive), so unrelated stations don't leak into station-level
    aggregation.
    """
    origin_upper = origin.strip().upper()
    destination_upper = destination.strip().upper()

    origin_idx = next(
        (i for i, s in enumerate(stops) if (s.get("station") or "").strip().upper() == origin_upper),
        None,
    )
    destination_idx = next(
        (i for i, s in enumerate(stops) if (s.get("station") or "").strip().upper() == destination_upper),
        None,
    )

    if origin_idx is None or destination_idx is None or destination_idx < origin_idx:
        return []

    return stops[origin_idx:destination_idx + 1]