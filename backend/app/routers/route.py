from typing import Optional

from fastapi import APIRouter, HTTPException

from app.services.trainstats_client import fetch_relation_html, fetch_train_details_html
from app.utils.dates import parse_iso_date, validate_range
from app.utils.html_parsing import parse_relation_html, parse_train_details_html
from app.utils.stats import aggregate_route_stats

router = APIRouter(prefix="/route", tags=["route"])


@router.get("/stats")
def get_route_stats(
    origin: str,
    destination: str,
    start_date: str,
    end_date: str,
    train_number: Optional[str] = None,
    on_time_threshold_minutes: int = 5,
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

    return {
        "origin": origin,
        "destination": destination,
        "start_date": start_date,
        "end_date": end_date,
        "trains_analyzed": len(trains),
        "overall": overall,
        "by_train": by_train,
    }
