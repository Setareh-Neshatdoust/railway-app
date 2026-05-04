from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Any, Optional
from datetime import date, datetime,timedelta
import requests

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
MAX_RANGE_DAYS = 366
CATEGORY_CODES = {"FR", "REG", "IC", "NCL", "EC", "EN", "ES", "FA", "FB"}

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
    from bs4 import BeautifulSoup
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
    from bs4 import BeautifulSoup
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

def parse_iso_date(value: str) -> date:
    try:
        return date.fromisoformat(value)
    except Exception:
        raise HTTPException(status_code=400,detail=f"Invalid date format '{value}'. Expected YYYY-MM-DD")
    
def validate_range (s: date, e: date, max_days: int= MAX_RANGE_DAYS) -> None:
    if e < s:
        raise HTTPException(status_code=400, detail="End_date must be greater than start_date.")
    if (e-s).days >max_days:
        raise HTTPException (status_code=400, detail=f"Date range too large ({(e - s).days} days). Max allowed is {max_days} days.")

def parse_train_details_html(html: str, 
                        start_date: Optional[str]=None, 
                        end_date: Optional[str]=None 
                        ) -> List [Dict[str,Any]]:
    from bs4 import BeautifulSoup
    if "Fatal error" in html:
        return []
    
    soup = BeautifulSoup(html, "html.parser")
    daily_records=[]
    for table in soup.find_all("table"):
        headers_row = table.find("tr")
        if not headers_row:
            continue
        header_cells = [c.get_text(strip=True).lower() for c in headers_row.find_all(["th", "td"])]
        if "data" not in header_cells or "giorno" not in header_cells:
            continue
        for row in table.find_all("tr")[1:]:
            cells = [c.get_text(strip=True) for c in row.find_all(["td", "th"])]
            if len(cells) < 4:
                continue
            daily_records.append({
                "day":             cells[0] if len(cells) > 0 else None,
                "date":            cells[1] if len(cells) > 1 else None,
                "origin":          cells[2] if len(cells) > 2 else None,
                "departure_time":  cells[3] if len(cells) > 3 else None,
                "departure_delay": cells[4] if len(cells) > 4 else None,
                "destination":     cells[5] if len(cells) > 5 else None,
                "arrival_time":    cells[6] if len(cells) > 6 else None,
                "arrival_delay":   cells[7] if len(cells) > 7 else None,
                "actions":         cells[8] if len(cells) > 8 else None,  
            })
    if start_date and end_date:
        s = parse_iso_date(start_date)
        e = parse_iso_date(end_date)
        validate_range (s,e)
        def parse_italian_date (d:str) -> Optional[date]:
            try:
                return datetime.strptime (d, "%d/%m/%Y"). date()
            except:
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

@app.get("/")
def root():
    return {"message": "Railway App API", "version": "1.0.0"}
@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/train/relations")
def get_relations(origin: str, destination: str):
    url = "https://trainstats.altervista.org/cercarelazione.php"
    headers = {"User-Agent": "Mozilla/5.0"}
    response = requests.get(
        url,
        params={
            "stazpart": origin.upper(),
            "stazarr": destination.upper()
        },
        headers=headers,
        timeout=10
    )
    trains = parse_relation_html(response.text)
    return {
        "origin": origin,
        "destination": destination,
        "count": len(trains),
        "trains": trains
    }

@app.get("/train/stops")
def get_train_stops(
    train_number: str,
    travel_date: str,
    origin: str,
):
    """
    Get intermediate stops for a specific train from TrainStats.
    date format: DD_MM_YYYY (e.g. 29_04_2026)
    """
    url = "https://trainstats.altervista.org/dettaglioTreno.php"
    headers = {"User-Agent": "Mozilla/5.0"}
    response = requests.get(
        url,
        params={
            "treno": train_number,
            "data": travel_date,
            "sp": origin.upper(),
        },
        headers=headers,
        timeout=10
    )
    stops = parse_train_stops_html(response.text)
    return {
        "train_number": train_number,
        "date": travel_date,
        "origin": origin,
        "total_stops": len(stops),
        "stops": stops
    }

@app.get("/train/details")
def get_train_details(
    train_number: str,
    origin: str,
    destination: str,
    departure_time: str,
    arrival_time: str,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
):
    url = "https://trainstats.altervista.org/cercatreno.php"
    headers = {"User-Agent": "Mozilla/5.0"}
    response = requests.get(
        url,
        params={
            "ref": "cr",
            "treno": train_number,
            "stazpart": origin.upper(),
            "stazarr": destination.upper(),
            "op": departure_time,
            "oa": arrival_time,
        },
        headers=headers,
        timeout=10
    )
    response.encoding = "utf-8"
    records = parse_train_details_html(response.text, start_date, end_date)

    return {
        "train_number": train_number,
        "origin": origin,
        "destination": destination,
        "start_date": start_date,
        "end_date": end_date,
        "total_records": len(records),
        "daily_records": records
    }

@app.get("/train/history")
def get_train_history(
    train_number: str,
    origin: str,
    start_date: str,
    end_date: str,
):
    """
    Get train stops for each day in a date range.
    For each day, queries dettaglioTreno.php.
    """
    s = parse_iso_date(start_date)
    e = parse_iso_date(end_date)
    validate_range(s, e, max_days=30) 

    url = "https://trainstats.altervista.org/dettaglioTreno.php"
    headers = {"User-Agent": "Mozilla/5.0"}

    results = []
    current = s
    while current <= e:
        date_str = current.strftime("%d_%m_%Y")
        try:
            response = requests.get(
                url,
                params={
                    "treno": train_number,
                    "data": date_str,
                    "sp": origin.upper(),
                },
                headers=headers,
                timeout=10
            )
            response.encoding = "utf-8"
            stops = parse_train_stops_html(response.text)
            if stops:
                results.append({
                    "date": current.isoformat(),
                    "date_italian": date_str,
                    "total_stops": len(stops),
                    "stops": stops
                })
        except Exception:
            pass
        current += timedelta(days=1)

    return {
        "train_number": train_number,
        "origin": origin,
        "start_date": start_date,
        "end_date": end_date,
        "total_days": len(results),
        "history": results
    }
    
