"""
Checks that the application gives the same numbers as TrainStats, route by route.

For each case (a route A -> B and a period) it asks two independent programs:
  1. the application, through its API (/route/stats), exactly as the web page does;
  2. a small separate reader in this file (the "oracle"), which downloads the same TrainStats
     pages and computes the numbers again with its own code. It imports nothing from the app.
It then compares every number, and also checks rules that the app's answer must always respect.

Run it on the computer where the app is running (Docker or uvicorn):
    python validate_against_trainstats.py --case "ALBA" "TORINO P.NUOVA" 2026-09-02 2026-11-03 --verbose
    python validate_against_trainstats.py --routes 100 --seed 1
"""
import argparse
import csv
import json
import random
import re
import time
from datetime import date, datetime, timedelta
from html.parser import HTMLParser
from pathlib import Path

import requests

TRAINSTATS = "https://trainstats.altervista.org"
HEADERS = {"User-Agent": "Mozilla/5.0"}
THRESHOLD = 5        # on-time limit in minutes, the app's default
PAUSE = 0.3          # seconds between two requests to TrainStats, to be gentle with it
TOLERANCE = 0.011    # both sides round to 2 decimals


# ---------------------------------------------------------------- the oracle: reading TrainStats

class TableRows(HTMLParser):
    """Collects the text of every cell of every table row (standard library, not BeautifulSoup)."""

    def __init__(self):
        super().__init__()
        self.rows, self.row, self.cell = [], None, None

    def handle_starttag(self, tag, attrs):
        if tag == "tr":
            self.row = []
        elif tag in ("td", "th") and self.row is not None:
            self.cell = ""

    def handle_data(self, data):
        if self.cell is not None:
            self.cell += data

    def handle_endtag(self, tag):
        if tag in ("td", "th") and self.row is not None and self.cell is not None:
            self.row.append(" ".join(self.cell.split()))
            self.cell = None
        elif tag == "tr" and self.row is not None:
            self.rows.append(self.row)
            self.row = None


TIME = re.compile(r"^\d{1,2}:\d{2}(:\d{2})?$")   # 06:25 or 06:25:00


def relation_entries(origin, destination):
    """The trains of the relation: (number, departure time, arrival time) for each row of the page.
    A row is recognised by its content: the train number is the last all-digit cell before the
    first time, and the first two times are the departure and the arrival."""
    html = get(f"{TRAINSTATS}/cercarelazione.php", {"stazpart": origin.upper(), "stazarr": destination.upper()})
    parser = TableRows()
    parser.feed(html)
    entries = []
    for cells in parser.rows:
        times = [i for i, c in enumerate(cells) if TIME.match(c)]
        if len(times) < 2:
            continue
        numbers = [c for c in cells[:times[0]] if c.isdigit()]
        if numbers:
            entries.append((numbers[-1], cells[times[0]], cells[times[1]]))
    return entries


def daily_rows(number, origin, destination, dep_time, arr_time):
    """The daily list of one entry: the rows of the table that TrainStats writes into the page."""
    html = get(f"{TRAINSTATS}/cercatreno.php", {"ref": "cr", "treno": number, "stazpart": origin.upper(),
                                                "stazarr": destination.upper(), "op": dep_time, "oa": arr_time})
    match = re.search(r"tabDGdataCSV\s*=\s*`(.*?)`", html, re.DOTALL)
    if not match:
        return []
    lines = [line for line in match.group(1).splitlines() if line.strip()]
    return list(csv.reader(lines[1:], delimiter=";"))   # the first line is the header


def minutes(cell):
    """A delay cell as a whole number of minutes, or None if it is not exactly a number."""
    text = (cell or "").strip()
    return int(text) if re.fullmatch(r"[+-]?\d+", text) else None


def is_cancelled(row):
    """TrainStats marks a cancelled trip with "Soppresso" (or "cancellato") in the delays or in the notes:
    columns 5 and 8 are the departure and arrival delays, 9 and 10 the status and the changes."""
    text = " ".join(row[i] for i in (5, 8, 9, 10) if i < len(row)).lower()
    return "soppress" in text or "cancellat" in text


def summarise(rows):
    """The indicators of a list of trips, computed from their definitions."""
    cancelled = [r for r in rows if is_cancelled(r)]
    ran = [r for r in rows if not is_cancelled(r)]
    departures = [m for r in ran if (m := minutes(r[5])) is not None]
    arrivals = [m for r in ran if (m := minutes(r[8])) is not None]
    mean = lambda values: round(sum(values) / len(values), 2) if values else None
    return {
        "total_records": len(rows),
        "cancelled_count": len(cancelled),
        "avg_departure_delay_min": mean(departures),
        "avg_arrival_delay_min": mean(arrivals),
        "on_time_percentage": round(100 * sum(a <= THRESHOLD for a in arrivals) / len(arrivals), 2) if arrivals else None,
    }


def oracle(origin, destination, start, end, notes):
    """Whole journey from A to B in the period, computed only from TrainStats' pages."""
    trips = {}   # train number -> {date: row}; a train listed twice keeps one row per day
    for number, dep_time, arr_time in relation_entries(origin, destination):
        for row in daily_rows(number, origin, destination, dep_time, arr_time):
            if len(row) < 10:
                continue
            try:
                day = datetime.strptime(row[2].strip(), "%d/%m/%Y").date()
            except ValueError:
                notes.append(f"unreadable date {row[2]!r} in train {number}")
                continue
            if start <= day <= end:
                trips.setdefault(number, {}).setdefault(day, row)
            for cell in (row[5], row[8]):
                if cell.strip() and minutes(cell) is None:
                    notes.append(f"non-numeric delay {cell.strip()!r}")
    by_train = {number: summarise(list(days.values())) for number, days in trips.items() if days}
    every_trip = [row for days in trips.values() for row in days.values()]
    return {"overall": summarise(every_trip), "by_train": by_train}


def get(url, params):
    time.sleep(PAUSE)
    response = requests.get(url, params=params, headers=HEADERS, timeout=30)
    response.encoding = "utf-8"
    response.raise_for_status()
    return response.text


# ---------------------------------------------------------------- comparing

FIELDS = ["total_records", "cancelled_count", "avg_departure_delay_min", "avg_arrival_delay_min", "on_time_percentage"]


def same(a, b):
    if a is None or b is None:
        return a is None and b is None
    return abs(a - b) <= TOLERANCE


def compare(app, expected):
    """Every number of the app's answer against the oracle; returns the list of differences."""
    differences = []
    for field in FIELDS:
        if not same(app["overall"][field], expected["overall"][field]):
            differences.append(f"overall {field}: app {app['overall'][field]} vs TrainStats {expected['overall'][field]}")
    app_trains = {t["train_number"]: t for t in app["by_train"]}
    for number in sorted(set(app_trains) | set(expected["by_train"])):
        if number not in app_trains or number not in expected["by_train"]:
            where = "only in the app" if number in app_trains else "only in TrainStats"
            differences.append(f"train {number} {where}")
            continue
        for field in FIELDS:
            if not same(app_trains[number][field], expected["by_train"][number][field]):
                differences.append(f"train {number} {field}: app {app_trains[number][field]} "
                                   f"vs TrainStats {expected['by_train'][number][field]}")
    return differences


def rules(app, start, end):
    """Rules the app's answer must respect whatever the data (consistency checks)."""
    broken = []
    overall, trains, days = app["overall"], app["by_train"], app.get("by_day", [])
    if sum(t["total_records"] for t in trains) != overall["total_records"]:
        broken.append("the trips of the trains do not add up to the total")
    if sum(t["cancelled_count"] for t in trains) != overall["cancelled_count"]:
        broken.append("the cancellations of the trains do not add up to the total")
    if sum(d["total_records"] for d in days) != overall["total_records"]:
        broken.append("the trips of the days do not add up to the total")
    if sum(d["cancelled_count"] for d in days) != overall["cancelled_count"]:
        broken.append("the cancellations of the days do not add up to the total")
    if any(not start.isoformat() <= d["date"] <= end.isoformat() for d in days):
        broken.append("a day lies outside the period")
    if app["trains_analyzed"] != len(trains):
        broken.append("trains_analyzed differs from the number of trains")
    for t in trains:
        if t["cancelled_count"] > t["total_records"]:
            broken.append(f"train {t['train_number']}: more cancellations than trips")
        if t["on_time_percentage"] is not None and not 0 <= t["on_time_percentage"] <= 100:
            broken.append(f"train {t['train_number']}: on-time rate outside 0-100")
    return broken


def split_rule(app_url, origin, destination, start, end, whole):
    """Metamorphic rule: the two halves of the period together have the same trips and cancellations."""
    middle = start + (end - start) // 2
    halves = [ask_app(app_url, origin, destination, start, middle),
              ask_app(app_url, origin, destination, middle + timedelta(days=1), end)]
    if any(h is None for h in halves):
        return []   # a half the source did not answer: nothing to conclude
    trips = sum(h["overall"]["total_records"] for h in halves)
    cancelled = sum(h["overall"]["cancelled_count"] for h in halves)
    broken = []
    if trips != whole["overall"]["total_records"]:
        broken.append(f"split: the halves have {trips} trips, the whole period {whole['overall']['total_records']}")
    if cancelled != whole["overall"]["cancelled_count"]:
        broken.append(f"split: the halves have {cancelled} cancellations, the whole period {whole['overall']['cancelled_count']}")
    return broken


# ---------------------------------------------------------------- the application

EMPTY = {"overall": {f: (0 if f in ("total_records", "cancelled_count") else None) for f in FIELDS},
         "by_train": [], "by_day": [], "trains_analyzed": 0}


def ask_app(app_url, origin, destination, start, end):
    """The app's answer; EMPTY when it says no trips were recorded, None when the source did not answer."""
    response = requests.get(f"{app_url}/route/stats", params={
        "origin": origin, "destination": destination,
        "start_date": start.isoformat(), "end_date": end.isoformat()}, timeout=600)
    if response.status_code == 404 and response.json().get("detail") == "Not Found":
        raise SystemExit(f"The app has no {app_url}/route/stats: check --app (with Docker /api, with uvicorn without)")
    if response.status_code == 404:
        return EMPTY
    if response.status_code == 502:
        return None
    response.raise_for_status()
    answer = response.json()
    return None if answer.get("trains_without_answer") else answer


def random_cases(app_url, rng):
    """Random relations (from the app's own lists of stations and destinations), one after the other.
    The period ends at most 90 days before the last day the relation was recorded, so that it usually
    contains trips; its length is random, from one week to four months."""
    stations = requests.get(f"{app_url}/stations", timeout=60).json()["stations"]
    latest_end = date.today() - timedelta(days=2)
    while True:
        origin = rng.choice(stations)
        try:
            response = requests.get(f"{app_url}/stations/destinations", params={"origin": origin}, timeout=60)
            if response.status_code != 200:
                continue
            destination = rng.choice(response.json()["destinations"])
            status = requests.get(f"{app_url}/route/direct-train",
                                  params={"origin": origin, "destination": destination}, timeout=120)
        except requests.RequestException:
            time.sleep(10)   # the app or the source did not answer: wait a little and choose another route
            continue
        last_seen = status.json().get("last_seen") if status.status_code == 200 else None
        if not last_seen:
            continue
        end = min(date.fromisoformat(last_seen), latest_end) - timedelta(days=rng.randint(0, 90))
        start = end - timedelta(days=rng.randint(6, 120))
        yield origin, destination, start, end


# ---------------------------------------------------------------- main

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--app", default="http://localhost:8000/api", help="address of the app's API")
    parser.add_argument("--routes", type=int, default=0, help="how many random routes with trips to check")
    parser.add_argument("--seed", type=int, default=1, help="the same seed gives the same random routes")
    parser.add_argument("--case", nargs=4, metavar=("ORIGIN", "DESTINATION", "START", "END"), help="one route")
    parser.add_argument("--split", action="store_true", help="also check that two halves add up to the whole period")
    parser.add_argument("--verbose", action="store_true")
    args = parser.parse_args()

    if args.case:
        o, d, s, e = args.case
        cases = [(o, d, date.fromisoformat(s), date.fromisoformat(e))]
    else:
        cases = random_cases(args.app, random.Random(args.seed))

    folder = Path("validation") / datetime.now().strftime("%Y-%m-%d_%H%M")
    folder.mkdir(parents=True, exist_ok=True)
    counts = {"PASS": 0, "FAIL": 0, "SKIP": 0, "EMPTY": 0}
    numbers_compared = 0

    with open(folder / "results.csv", "w", newline="", encoding="utf-8") as out:
        writer = csv.writer(out)
        writer.writerow(["#", "origin", "destination", "start", "end", "trains", "trips", "result", "details"])
        for i, (origin, destination, start, end) in enumerate(cases, 1):
            notes = []
            try:
                app = ask_app(args.app, origin, destination, start, end)
                expected = oracle(origin, destination, start, end, notes) if app is not None else None
            except requests.RequestException as error:
                app, expected, notes = None, None, [f"no answer: {error.__class__.__name__}"]

            if app is None or expected is None:
                result, problems = "SKIP", notes or ["TrainStats did not answer the app"]
            else:
                problems = compare(app, expected) + rules(app, start, end)
                if args.split:
                    problems += split_rule(args.app, origin, destination, start, end, app)
                result = "FAIL" if problems else "PASS"
                if result == "PASS" and expected["overall"]["total_records"] == 0:
                    result = "EMPTY"   # no trip on either side: agreeing on nothing proves little
                numbers_compared += len(FIELDS) * (1 + len(expected["by_train"]))
                (folder / f"case_{i:03}.json").write_text(json.dumps(
                    {"case": [origin, destination, start.isoformat(), end.isoformat()],
                     "app": {"overall": app["overall"], "by_train": app["by_train"]},
                     "trainstats": expected, "problems": problems, "notes": sorted(set(notes))},
                    indent=1, ensure_ascii=False), encoding="utf-8")

            counts[result] += 1
            trains = len(app["by_train"]) if app else ""
            trips = app["overall"]["total_records"] if app else ""
            writer.writerow([i, origin, destination, start, end, trains, trips, result, " | ".join(problems)])
            out.flush()
            print(f"{i:>3} {result}  {origin} -> {destination}  {start:%d/%m/%Y}-{end:%d/%m/%Y}  "
                  f"trains {trains}  trips {trips}")
            if args.verbose or result == "FAIL":
                for line in problems + sorted(set(notes)):
                    print(f"      {line}")
            if not args.case and counts["PASS"] + counts["FAIL"] >= args.routes:
                break   # enough routes with trips
            if not args.case and i >= 5 * args.routes:
                print("Stopped: too many routes without trips or without an answer")
                break

    checked = counts["PASS"] + counts["FAIL"]   # routes with trips, compared
    print(f"\nPASS {counts['PASS']}  FAIL {counts['FAIL']}  SKIP {counts['SKIP']}  EMPTY {counts['EMPTY']}  "
          f"({numbers_compared} numbers compared)")
    if checked >= 10 and counts["FAIL"] == 0:
        print(f"No difference in {checked} routes: with 95% confidence, fewer than "
              f"{300 / checked:.1f}% of routes would differ (rule of three).")
    print(f"Details in {folder}/")


if __name__ == "__main__":
    main()
