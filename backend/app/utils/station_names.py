import re
from typing import List


def abbreviation_pattern(name: str) -> re.Pattern:
    """
    In TrainStats names a dot marks an abbreviation: 'P.NUOVA' = 'PORTA NUOVA',
    'C.SO' = 'CORSO'. Each dot becomes 'any letters, then maybe a space'.
    """
    escaped = re.escape(name.strip().upper())
    return re.compile(escaped.replace(r"\.", r"[^ ]* ?"))


def match_stop_station(name: str, known_names: List[str]) -> str:
    """
    Finds how the stop lists write a station the route search writes differently.
    Returns the name unchanged when there is no single clear match.
    """
    wanted = name.strip().upper()
    upper_names = [known.strip().upper() for known in known_names]

    if wanted in upper_names:
        return wanted

    if "." in wanted:
        pattern = abbreviation_pattern(wanted)
        candidates = [known for known in upper_names if pattern.fullmatch(known)]
        if len(candidates) == 1:
            return candidates[0]

    candidates = [known for known in upper_names if known.startswith(wanted + " ")]
    if len(candidates) == 1:
        return candidates[0]

    return wanted