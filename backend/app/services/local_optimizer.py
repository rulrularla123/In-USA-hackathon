"""Local nearest-neighbour TSP fallback — used when Claude is unavailable."""

from __future__ import annotations

import math
from app.models.schemas import PlaceIn


def _dist_km(a: PlaceIn, b: PlaceIn) -> float:
    dlat = (a.lat - b.lat) * 111
    dlng = (a.lng - b.lng) * 91      # cos(35°) ≈ 0.82
    return math.sqrt(dlat ** 2 + dlng ** 2)


def _travel_min(a: PlaceIn, b: PlaceIn) -> int:
    km = _dist_km(a, b)
    if km < 5:   return round((km / 20)  * 60 + 5)
    if km < 30:  return round((km / 40)  * 60 + 10)
    if km < 100: return round((km / 70)  * 60 + 15)
    return       round((km / 100) * 60 + 30)


def local_optimize(places: list[PlaceIn]) -> tuple[list[str], list[dict], int]:
    """
    Nearest-neighbour TSP.
    Returns (ordered_place_ids, route_legs, total_driving_minutes).
    Favourite places get a 25% distance discount so they appear earlier.
    """
    if len(places) <= 1:
        return [p.place_id for p in places], [], 0

    remaining = list(places)
    route = [remaining.pop(0)]

    while remaining:
        last = route[-1]
        best_score, best_idx = float("inf"), 0
        for i, p in enumerate(remaining):
            km = _dist_km(last, p)
            score = km * 0.75 if p.priority.value == "Favorite" else km
            if score < best_score:
                best_score, best_idx = score, i
        route.append(remaining.pop(best_idx))

    ordered_ids = [p.place_id for p in route]
    legs: list[dict] = []
    total = 0

    for i in range(1, len(route)):
        mins = _travel_min(route[i - 1], route[i])
        km   = round(_dist_km(route[i - 1], route[i]), 2)
        legs.append({
            "from_place_id":       route[i - 1].place_id,
            "to_place_id":         route[i].place_id,
            "driving_time_minutes": mins,
            "distance_km":         km,
        })
        total += mins

    return ordered_ids, legs, total
