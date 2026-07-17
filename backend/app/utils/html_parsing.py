import re
from datetime import date, datetime
from typing import Any, Dict, List, Optional

from bs4 import BeautifulSoup
from fastapi import HTTPException

from app.config import CATEGORY_CODES
from app.utils.dates import parse_iso_date, validate_range


def normalize_cells(cells: List[str]) -> List[str]:
    if not cells:
        return []
    lower_cells = " ".join([c for c in cells if c]).lower()
    if any(k in lower_cells for k in ["categoria", "n. treno", "stazione partenza"]):
        return []
    if cells and cells[0] == "" and len(cells) > 1:
        cells = cells[1:]
    if len(cells) > 1 and cells[0] not in CATEGORY_CODES and cells[1] in CATEGORY_CODES:
        cells = cells[1:]
    return cells


def parse_relation_html(html: str) -> List[Dict[str, Any]]:
    if "Fatal error" in html:
        return []
    trains = []
    soup = BeautifulSoup(html, "html.parser")
    tables = soup.find_all("table")
    for table in tables:
        for row in table.find_all("tr"):
            cells = [c.get_text(strip=True) for c in row.find_all(["td", "th"])]
            cells = normalize_cells(cells)
            if len(cells) < 6:
                continue
            trains.append({
                "category": cells[0],
                "train_number": cells[1] if len(cells) > 1 else None,
                "origin": cells[2] if len(cells) > 2 else None,
                "origin_time": cells[3] if len(cells) > 3 else None,
                "origin_delay": cells[4] if len(cells) > 4 else None,
                "destination": cells[5] if len(cells) > 5 else None,
                "arrival_time": cells[6] if len(cells) > 6 else None,
                "arrival_delay": cells[7] if len(cells) > 7 else None,
                "sample_count": cells[8] if len(cells) > 8 else None,
                "last_seen": cells[9] if len(cells) > 9 else None,
            })
    return trains


def parse_train_stops_html(html: str) -> List[Dict[str, Any]]:
    if "Fatal error" in html:
        return []

    soup = BeautifulSoup(html, "html.parser")
    stops = []

    for table in soup.find_all("table"):
        headers_row = table.find("tr")
        if not headers_row:
            continue
        header_cells = [c.get_text(strip=True).lower() for c in headers_row.find_all(["th", "td"])]
        if "stazione" not in header_cells:
            continue

        for row in table.find_all("tr")[1:]:
            cells = [c.get_text(strip=True) for c in row.find_all(["td", "th"])]
            if len(cells) < 4:
                continue
            stops.append({
                "stop_number":          cells[0] if len(cells) > 0 else None,
                "station":              cells[1] if len(cells) > 1 else None,
                "platform":             cells[2] if len(cells) > 2 else None,
                "arrival_scheduled":    cells[3] if len(cells) > 3 else None,
                "arrival_actual":       cells[4] if len(cells) > 4 else None,
                "arrival_delay":        cells[5] if len(cells) > 5 else None,
                "departure_scheduled":  cells[6] if len(cells) > 6 else None,
                "departure_actual":     cells[7] if len(cells) > 7 else None,
                "departure_delay":      cells[8] if len(cells) > 8 else None,
            })

    return stops


def parse_train_details_html(
    html: str,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
) -> List[Dict[str, Any]]:
    if "Fatal error" in html:
        return []
    match = re.search(r"var tabDGdataCSV = `(.*?)`;", html, re.DOTALL)
    if not match:
        return []

    csv_text = match.group(1)

    csv_text = match.group(1)
    lines = [line for line in csv_text.strip().split("\n") if line.strip()]
    if not lines:
        return []

    data_lines = lines[1:]
    daily_records = []
    for line in data_lines:
        fields = line.split(";")
        if len(fields) < 10:
            continue
        daily_records.append({
            "day":             fields[1],
            "date":            fields[2],
            "origin":          fields[3],
            "departure_time":  fields[4],
            "departure_delay": fields[5],
            "destination":     fields[6],
            "arrival_time":    fields[7],
            "arrival_delay":   fields[8],
            "status":          fields[9] if len(fields) > 9 else None,
            "variations":      fields[10] if len(fields) > 10 else None,
        })

    
    if start_date and end_date:
        s = parse_iso_date(start_date)
        e = parse_iso_date(end_date)
        validate_range(s, e)

        def parse_italian_date(d: str) -> Optional[date]:
            try:
                return datetime.strptime(d, "%d/%m/%Y").date()
            except Exception:
                return None

        daily_records = [
            r for r in daily_records
            if r.get("date") and parse_italian_date(r["date"]) and s <= parse_italian_date(r["date"]) <= e
        ]
    elif start_date or end_date:
        raise HTTPException(
            status_code=400,
            detail="Provide both start_date and end_date, or neither.",
        )
    return daily_records
