from functools import lru_cache
from typing import Tuple

from app.services.trainstats_client import fetch_stop_station_list_text
from app.utils.html_parsing import parse_destinations_text
from app.utils.station_names import match_stop_station


@lru_cache(maxsize=32)
def get_stop_station_names(date_str: str) -> Tuple[str, ...]:
    """Downloads the stop-list station names once per date and remembers them."""
    names = parse_destinations_text(fetch_stop_station_list_text(date_str))
    if not names:
        raise ValueError("Empty station list")  # not cached, tried again next time
    return tuple(names)


def stop_station_name(name: str, date_str: str) -> str:
    """The station name as TrainStats' stop lists write it, e.g. TORINO P.NUOVA -> TORINO PORTA NUOVA."""
    try:
        return match_stop_station(name, list(get_stop_station_names(date_str)))
    except Exception:
        return name