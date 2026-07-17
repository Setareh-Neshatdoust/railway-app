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