import requests

from app.config import BASE_URL, DEFAULT_HEADERS, REQUEST_TIMEOUT


def fetch_relation_html(origin: str, destination: str) -> str:
    response = requests.get(
        f"{BASE_URL}/cercarelazione.php",
        params={
            "stazpart": origin.upper(),
            "stazarr": destination.upper(),
        },
        headers=DEFAULT_HEADERS,
        timeout=REQUEST_TIMEOUT,
    )
    return response.text


def fetch_train_stops_html(
    train_number: str,
    travel_date: str,
    origin: str,
    force_utf8: bool = False,
) -> str:
    response = requests.get(
        f"{BASE_URL}/dettaglioTreno.php",
        params={
            "treno": train_number,
            "data": travel_date,
            "sp": origin.upper(),
        },
        headers=DEFAULT_HEADERS,
        timeout=REQUEST_TIMEOUT,
    )
    # force_utf8 preserves original behavior: get_train_history set this, get_train_stops didn't
    if force_utf8:
        response.encoding = "utf-8"
    return response.text


def fetch_train_details_html(
    train_number: str,
    origin: str,
    destination: str,
    departure_time: str,
    arrival_time: str,
) -> str:
    response = requests.get(
        f"{BASE_URL}/cercatreno.php",
        params={
            "ref": "cr",
            "treno": train_number,
            "stazpart": origin.upper(),
            "stazarr": destination.upper(),
            "op": departure_time,
            "oa": arrival_time,
        },
        headers=DEFAULT_HEADERS,
        timeout=REQUEST_TIMEOUT,
    )
    response.encoding = "utf-8"
    return response.text
