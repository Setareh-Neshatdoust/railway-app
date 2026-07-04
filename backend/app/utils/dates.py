from datetime import date

from fastapi import HTTPException

from app.config import MAX_RANGE_DAYS


def parse_iso_date(value: str) -> date:
    try:
        return date.fromisoformat(value)
    except Exception:
        raise HTTPException(status_code=400, detail=f"Invalid date format '{value}'. Expected YYYY-MM-DD")


def validate_range(s: date, e: date, max_days: int = MAX_RANGE_DAYS) -> None:
    if e < s:
        raise HTTPException(status_code=400, detail="End_date must be greater than start_date.")
    if (e - s).days > max_days:
        raise HTTPException(status_code=400, detail=f"Date range too large ({(e - s).days} days). Max allowed is {max_days} days.")
