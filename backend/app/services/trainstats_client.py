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
    """ force_utf8 preserves original behavior: get_train_history set this, get_train_stops didn't """
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
""" fetching all availabe stations can be searched to be analyzed """
def fetch_stations_js() -> str:
    response = requests.get(
        f"{BASE_URL}/script/stazioniCvNew.js",
        headers=DEFAULT_HEADERS,
        timeout=REQUEST_TIMEOUT,
    )
    response.encoding = "utf-8"
    return response.text

""" fecting the specific destination for the chosen origin according to Trainstats "cerca realizione" page """
def fetch_destination_text(origin: str) -> str:
    response = requests.get(
        f"{BASE_URL}/libs/getRelazioniByCodStazione.php",
        params={"staz":origin.upper()},
        headers=DEFAULT_HEADERS,
        timeout= REQUEST_TIMEOUT,
    )
    response.encoding = "utf-8"
    return response.text



def fetch_stops_between_text(origin: str, destination: str, date_str: str) -> str:
    """
    The request behind TrainStats' "Cerca per fermate" page: every train that
    stopped at origin and then at selected destination on one day.
    """
    response = requests.get(
        f"{BASE_URL}/libs/getAPResults.php",
        params={"sp": origin.upper(), "sa": destination.upper(), "data": date_str},
        headers=DEFAULT_HEADERS,
        timeout=REQUEST_TIMEOUT,
    )
    response.encoding = "utf-8"
    return response.text


def fetch_stop_station_list_text(date_str: str) -> str:
    """
    The station list behind TrainStats' "Cerca per fermate" page. Stop lists use
    these spellings (e.g. TORINO PORTA NUOVA), the route search uses short ones
    (e.g. TORINO P.NUOVA).
    """
    response = requests.get(
        f"{BASE_URL}/libs/getStazioniList.php",
        params={"data": date_str},
        headers=DEFAULT_HEADERS,
        timeout=REQUEST_TIMEOUT,
    )
    response.encoding = "utf-8"
    return response.text
