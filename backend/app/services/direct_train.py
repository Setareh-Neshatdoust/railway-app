import time
from datetime import date, timedelta
from typing import Any, Dict, Optional, Tuple

from app.services.station_names import stop_station_name
from app.services.trainstats_client import fetch_relation_html, fetch_stops_between_text
from app.utils.html_parsing import parse_relation_html, parse_stops_between_json, same_name
from app.utils.relation_status import SPECIAL_CATEGORIES, classify_relation

CACHE_SECONDS = 24 * 60 * 60  # one day
_cache: Dict[Tuple[str, str], Tuple[float, Dict[str, Any]]] = {}


def recent_through_train(origin: str, destination: str, today: date, days: int = 7) -> Optional[date]:
    """
    Asks "Cerca per fermate" for yesterday, then the day before, and so on.
    Returns the first day on which a regular train stopped at origin and then at
    destination WITHOUT starting and ending there (those are the relation's own
    trains), or None if there was none in the last `days` days.
    """
    for back in range(1, days + 1):
        day = today - timedelta(days=back)
        date_str = day.strftime("%d_%m_%Y")
        stop_origin = stop_station_name(origin, date_str)
        stop_destination = stop_station_name(destination, date_str)
        text = fetch_stops_between_text(stop_origin, stop_destination, date_str)
        if not text.strip().startswith("["):
            raise ValueError("Cerca per fermate answered with an error page")
        for record in parse_stops_between_json(text, stop_origin, stop_destination):
            own_train = (same_name(record["train_origin"], stop_origin)
                         and same_name(record["train_destination"], stop_destination))
            special = (record["category"] or "").strip().upper() in SPECIAL_CATEGORIES
            if not own_train and not special:
                return day
    return None


def direct_train_status(origin: str, destination: str, today: Optional[date] = None) -> Dict[str, Any]:
    """
    Two separate facts, as in TrainStats:
      - the relation (trains that start at origin and end at destination)
      - the last day a train passed through both stations, checked only when the
        relation is not active
    The answer is kept for one day, so TrainStats is asked at most once a day per pair.
    """
    today = today or date.today()
    key = (origin.strip().upper(), destination.strip().upper())

    cached = _cache.get(key)
    if cached and time.time() - cached[0] < CACHE_SECONDS:
        return cached[1]

    trains = parse_relation_html(fetch_relation_html(origin, destination))
    result = classify_relation(trains, today)
    result["through_last_seen"] = None

    if result["relation"] != "active":
        # The destination list can spell a station differently from TrainStats' own pages
        # (MACCARESE -> MACCARESE-FREGENE): use the names of the relation page when there are some
        origin_name = (trains[0].get("origin") or origin) if trains else origin
        destination_name = (trains[0].get("destination") or destination) if trains else destination
        result["through_last_seen"] = recent_through_train(origin_name, destination_name, today)

    _cache[key] = (time.time(), result)
    return result