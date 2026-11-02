import re
from datetime import date
from typing import Any, Dict, List, Optional

# Categories TrainStats gives to trains that run once or twice (special trains).
# An empty category behaves the same way.
SPECIAL_CATEGORIES = {"EXP", "NCL", ""}

def is_special(train: Dict[str, Any]) -> bool:
    return (train.get("category") or "").strip().upper() in SPECIAL_CATEGORIES


def parse_count(text: Optional[str]) -> int:
    """'N. Rilevamenti' as a number: '12' -> 12, anything else -> 0."""
    match = re.search(r"\d+", text or "")
    return int(match.group()) if match else 0


def parse_last_seen(text: Optional[str]) -> Optional[date]:
    """'Ultimo rilevamento' is written dd/mm/yyyy."""
    match = re.search(r"(\d{1,2})/(\d{1,2})/(\d{4})", text or "")
    if not match:
        return None
    day, month, year = map(int, match.groups())
    return date(year, month, day)

def group_by_train(trains: List[Dict[str, Any]]) -> Dict[str, Dict[str, Any]]:
    """
    One train can have several rows (one per timetable change).
    Adds up its records and keeps its most recent date.
    """
    grouped: Dict[str, Dict[str, Any]] = {}
    for train in trains:
        number = train.get("train_number") or ""
        entry = grouped.setdefault(number, {"count": 0, "last_seen": None})
        entry["count"] += parse_count(train.get("sample_count"))
        seen = parse_last_seen(train.get("last_seen"))
        if seen and (entry["last_seen"] is None or seen > entry["last_seen"]):
            entry["last_seen"] = seen
    return grouped

def latest(dates: List[Optional[date]]) -> Optional[date]:
    known = [d for d in dates if d is not None]
    return max(known) if known else None

def classify_relation(
    trains: List[Dict[str, Any]],
    today: date,
    window_days: int = 7,
    min_count: int = 5,
) -> Dict[str, Any]:
    """
    Describes the relation itself: trains that START at the origin and END at the
    destination (TrainStats "Cerca relazione"). Trains that only pass through are
    checked separately (direct_train.recent_through_train).
      empty         -> the relation page has no train
      special_only  -> only special trains (EXP, NCL, no category)
      active        -> a regular train recorded at least min_count times, seen in the last window_days
      occasional    -> regular trains seen recently, but recorded fewer than min_count times
      inactive      -> no regular train seen in the last window_days
    """
    if not trains:
        return {"relation": "empty", "last_seen": None, "count": 0}

    regular = [t for t in trains if not is_special(t)]
    if not regular:
        specials = group_by_train(trains).values()
        return {"relation": "special_only",
                "last_seen": latest([g["last_seen"] for g in specials]),
                "count": sum(g["count"] for g in specials)}

    grouped = group_by_train(regular).values()
    recent = [g for g in grouped if g["last_seen"] and (today - g["last_seen"]).days <= window_days]

    for entry in recent:
        if entry["count"] >= min_count:
            return {"relation": "active", "last_seen": entry["last_seen"], "count": entry["count"]}

    if recent:
        return {"relation": "occasional",
                "last_seen": latest([g["last_seen"] for g in recent]),
                "count": sum(g["count"] for g in recent)}

    return {"relation": "inactive",
            "last_seen": latest([g["last_seen"] for g in grouped]),
            "count": sum(g["count"] for g in grouped)}