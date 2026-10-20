"""
How many destinations offered by TrainStats have no direct train now, and why are they listed?

Phase 1: for every TrainStats station, download its destination list (query 2,
         the list our Destination field shows).
Phase 2: for a random sample of those relations (or all of them):
         a) download the relation's trains (query 3) with how many times each
            one was recorded and when it was last seen (the history);
         b) ask "Cerca per fermate" (getAPResults) day by day, starting
            yesterday and going back up to --days days, whether any train
            stopped at the origin and then at the destination. It stops at the
            first day with a train, so working relations cost one request.
Summary: classify every checked relation and print counts and percentages.

Results are saved in CSV files after every request, so the run can be stopped
with Ctrl+C and started again: it continues where it stopped.

Run from the backend folder, for example:
    python -m scripts.check_relations phase1
    python -m scripts.check_relations phase2 --sample 1000
    python -m scripts.check_relations summary
"""
import argparse
import csv
import json
import math
import random
import re
import time
from datetime import date, timedelta
from pathlib import Path

from app.services.station_names import stop_station_name
from app.services.trainstats_client import (
    fetch_destination_text, fetch_relation_html, fetch_stations_js, fetch_stops_between_text,
)
from app.utils.html_parsing import (
    parse_destinations_text, parse_relation_html, parse_stations_js, parse_stops_between_json,
)

OUT_DIR = Path("relation_check")
RELATIONS_CSV = OUT_DIR / "all_relations.csv"
CHECKED_CSV = OUT_DIR / "checked_relations.csv"
RELATION_FIELDS = ["origin", "destination"]
CHECKED_FIELDS = ["origin", "destination", "train_count", "trains",
                  "recent_trains", "recent_day", "recent_days_checked"]


def first_int(text):
    match = re.search(r"\d+", text or "")
    return int(match.group()) if match else None


def parse_day(text):
    """TrainStats writes dates as dd/mm/yyyy; yyyy-mm-dd is accepted too."""
    match = re.search(r"(\d{1,2})[/-](\d{1,2})[/-](\d{4})", text or "")
    if match:
        day, month, year = map(int, match.groups())
        return date(year, month, day)
    match = re.search(r"(\d{4})-(\d{2})-(\d{2})", text or "")
    if match:
        year, month, day = map(int, match.groups())
        return date(year, month, day)
    return None


def read_rows(path):
    if not path.exists():
        return []
    with path.open(newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def append_row(path, fields, row):
    is_new = not path.exists()
    with path.open("a", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fields)
        if is_new:
            writer.writeheader()
        writer.writerow(row)


def phase1(pause):
    """One request per station: its list of destinations."""
    OUT_DIR.mkdir(exist_ok=True)
    done = {row["origin"] for row in read_rows(RELATIONS_CSV)}
    stations = parse_stations_js(fetch_stations_js())
    print(f"{len(stations)} stations, {len(done)} already done")
    for i, origin in enumerate(stations, 1):
        if origin in done:
            continue
        try:
            text = fetch_destination_text(origin)
            if "<" in text:
                raise ValueError("TrainStats answered with an error page")
            destinations = parse_destinations_text(text)
        except Exception as error:
            print(f"[{i}/{len(stations)}] {origin}: failed ({error}), will retry next run")
            continue
        # A station with no destinations is saved too, with an empty destination, so it is not asked again
        for destination in destinations or [""]:
            append_row(RELATIONS_CSV, RELATION_FIELDS, {"origin": origin, "destination": destination})
        print(f"[{i}/{len(stations)}] {origin}: {len(destinations)} destinations")
        time.sleep(pause)


def check_recent(origin, destination, days, pause):
    """
    Is there a direct train now? Asks "Cerca per fermate" for yesterday, then the day
    before, and so on, and stops at the first day with at least one train.
    Returns (trains found that day, that day, days asked).
    """
    for back in range(1, days + 1):
        day = date.today() - timedelta(days=back)
        date_str = day.strftime("%d_%m_%Y")
        # Stop lists spell some stations differently (TORINO P.NUOVA -> TORINO PORTA NUOVA)
        stop_origin = stop_station_name(origin, date_str)
        stop_destination = stop_station_name(destination, date_str)
        text = fetch_stops_between_text(stop_origin, stop_destination, date_str)
        if not text.strip().startswith("["):
            raise ValueError("Cerca per fermate answered with an error page")
        trains = {r["train_number"] for r in parse_stops_between_json(text, stop_origin, stop_destination)}
        time.sleep(pause)
        if trains:
            return len(trains), day.isoformat(), back
    return 0, None, days


def phase2(sample, seed, pause, days):
    """For each relation: its trains' history (query 3) and whether a direct train runs now (Cerca per fermate)."""
    relations = sorted({(r["origin"], r["destination"]) for r in read_rows(RELATIONS_CSV) if r["destination"]})
    if not relations:
        print("Run phase1 first.")
        return
    # Same seed, same sample: the run can be repeated and checked by someone else
    chosen = relations if sample is None else random.Random(seed).sample(relations, min(sample, len(relations)))
    done = {(r["origin"], r["destination"]) for r in read_rows(CHECKED_CSV)}
    todo = [rel for rel in chosen if rel not in done]
    print(f"{len(relations)} relations listed, {len(chosen)} chosen, {len(todo)} still to check "
          f"(at least {len(todo) * 2 * (pause + 1) / 3600:.1f} hours)")
    for i, (origin, destination) in enumerate(todo, 1):
        try:
            html = fetch_relation_html(origin, destination)
            if "Fatal error" in html:
                raise ValueError("TrainStats answered with an error page")
            trains = parse_relation_html(html)
            recent_trains, recent_day, days_checked = check_recent(origin, destination, days, pause)
        except Exception as error:
            print(f"[{i}/{len(todo)}] {origin} -> {destination}: failed ({error}), will retry next run")
            continue
        details = [{
            "train": f"{t.get('category') or ''} {t.get('train_number') or ''}".strip(),
            "count": first_int(t.get("sample_count")),
            "last_seen": d.isoformat() if (d := parse_day(t.get("last_seen"))) else None,
        } for t in trains]
        append_row(CHECKED_CSV, CHECKED_FIELDS, {
            "origin": origin,
            "destination": destination,
            "train_count": len(trains),
            "trains": json.dumps(details, ensure_ascii=False),
            "recent_trains": recent_trains,
            "recent_day": recent_day or "",
            "recent_days_checked": days_checked,
        })
        found = f"direct train on {recent_day}" if recent_day else f"no direct train in the last {days} days"
        print(f"[{i}/{len(todo)}] {origin} -> {destination}: {len(trains)} trains in history, {found}")
        time.sleep(pause)


def is_regular(train, min_count, max_age_days, today):
    """A train is regular if it was recorded at least min_count times and seen in the last max_age_days."""
    if train["count"] is None or train["last_seen"] is None:
        return False
    age = (today - date.fromisoformat(train["last_seen"])).days
    return train["count"] >= min_count and age <= max_age_days


def classify(row, min_count, max_age_days, today):
    """
    regular:   at least one train recorded often enough and seen recently
    stale:     some train was recorded often enough, but none was seen recently (the service ended or changed)
    rare:      every train was recorded only a few times (special trains, diversions, works)
    no_trains: listed as a destination, but TrainStats returns no train
    """
    trains = json.loads(row["trains"])
    if not trains:
        return "no_trains"
    if any(is_regular(t, min_count, max_age_days, today) for t in trains):
        return "regular"
    if any((t["count"] or 0) >= min_count for t in trains):
        return "stale"
    return "rare"


def wilson(k, n, z=1.96):
    """95% confidence interval of a proportion k/n (Wilson method)."""
    if n == 0:
        return (0.0, 0.0)
    p = k / n
    centre = (p + z * z / (2 * n)) / (1 + z * z / n)
    half = z * math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / (1 + z * z / n)
    return (max(0.0, centre - half), min(1.0, centre + half))


def summary(min_count, max_age_days, examples):
    today = date.today()
    listed = read_rows(RELATIONS_CSV)
    stations = {r["origin"] for r in listed}
    relations = {(r["origin"], r["destination"]) for r in listed if r["destination"]}
    checked = read_rows(CHECKED_CSV)
    print(f"Phase 1: {len(stations)} stations, {len(relations)} listed relations, "
          f"{sum(1 for r in listed if not r['destination'])} stations without destinations")
    print(f"Phase 2: {len(checked)} relations checked")
    if not checked:
        return
    n = len(checked)
    days = max(int(r["recent_days_checked"]) for r in checked)

    # 1. The main question: does the listed destination have a direct train now?
    direct = [r for r in checked if int(r["recent_trains"]) > 0]
    missing = [r for r in checked if int(r["recent_trains"]) == 0]
    print(f"\n1. Direct train (Cerca per fermate) in the last {days} days:")
    for name, rows in (("yes", direct), ("no", missing)):
        low, high = wilson(len(rows), n)
        print(f"  {name:<4} {len(rows):>6}  {len(rows) / n:6.1%}   (95% CI {low:.1%} - {high:.1%})")
    if n < len(relations):
        print(f"  Estimated for all {len(relations)} listed relations: about "
              f"{round(len(missing) / n * len(relations))} without a direct train now")

    # 2. Why are they listed? The relation history, for the ones without a direct train
    print(f"\n2. History of the relations WITHOUT a direct train now "
          f"(regular = a train recorded at least {min_count} times and seen in the last {max_age_days} days):")
    history = {"regular": [], "stale": [], "rare": [], "no_trains": []}
    for row in missing:
        history[classify(row, min_count, max_age_days, today)].append(row)
    for name, rows in history.items():
        share = len(rows) / len(missing) if missing else 0
        print(f"  {name:<10} {len(rows):>6}  {share:6.1%} of them")

    for name in ("stale", "rare", "no_trains", "regular"):
        print(f"\nExamples without a direct train now, history {name} (first {examples}):")
        for row in history[name][:examples]:
            trains = ", ".join(f"{t['train']} ({t['count']}x, last {t['last_seen']})" for t in json.loads(row["trains"]))
            print(f"  {row['origin']} -> {row['destination']}: {trains}")


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = parser.add_subparsers(dest="command", required=True)
    p1 = sub.add_parser("phase1", help="download the destination list of every station")
    p1.add_argument("--pause", type=float, default=1.5, help="seconds between requests (be kind to TrainStats)")
    p2 = sub.add_parser("phase2", help="download the direct trains of the relations")
    p2.add_argument("--sample", type=int, default=1000, help="how many relations to check")
    p2.add_argument("--all", action="store_true", help="check every relation instead of a sample (very long)")
    p2.add_argument("--seed", type=int, default=42, help="random seed, so the sample can be repeated")
    p2.add_argument("--pause", type=float, default=1.5)
    p2.add_argument("--days", type=int, default=7, help="how many past days to ask Cerca per fermate")
    s = sub.add_parser("summary", help="print counts and percentages")
    s.add_argument("--min-count", type=int, default=5)
    s.add_argument("--max-age-days", type=int, default=90)
    s.add_argument("--examples", type=int, default=15)
    args = parser.parse_args()

    if args.command == "phase1":
        phase1(args.pause)
    elif args.command == "phase2":
        phase2(None if args.all else args.sample, args.seed, args.pause, args.days)
    else:
        summary(args.min_count, args.max_age_days, args.examples)


if __name__ == "__main__":
    main()