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

def classify_history(
    trains: List[Dict[str, Any]],
    today: date,
    window_days: int = 7,
    min_count: int = 2,
) -> Dict[str, Any]:
    """
    Reads the trains of a relation (cercarelazione.php) and decides:
      no_trains     -> TrainStats returns no train at all
      special_only  -> only special trains (EXP, NCL, no category)
      active        -> a regular train recorded at least min_count times, seen in the last window_days
      check_recent  -> not sure: ask "Cerca per fermate" (step 2)
    """
    if not trains:
        # The relation page can be empty although trains run (e.g. ASTI -> CASTAGNOLE DELLE LANZE):
        # let "Cerca per fermate" decide
        return {"status": "check_recent", "last_seen": None}

    regular = [t for t in trains if not is_special(t)]
    if not regular:
        specials = group_by_train(trains)
        return {"status": "special_only", "last_seen": latest([g["last_seen"] for g in specials.values()])}

    grouped = group_by_train(regular)
    for entry in grouped.values():
        seen = entry["last_seen"]
        if entry["count"] >= min_count and seen and (today - seen).days <= window_days:
            return {"status": "active", "last_seen": seen}

    return {"status": "check_recent", "last_seen": latest([g["last_seen"] for g in grouped.values()])}