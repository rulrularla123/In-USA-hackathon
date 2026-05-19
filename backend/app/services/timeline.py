"""Timeline construction and over-schedule calculation."""

from __future__ import annotations

from dataclasses import dataclass, field

from app.models.schemas import PlaceIn, TimelineItemOut


@dataclass
class BuiltTimeline:
    items: list[TimelineItemOut]
    over_schedule_minutes: int


def build_timeline(
    optimized_order: list[str],
    route_legs: list[dict],         # from Claude
    places: list[PlaceIn],
    start_time: str,
    end_time: str,
) -> BuiltTimeline:
    """
    Build a complete timeline using Claude's driving times.
    Also computes how many minutes the schedule overruns end_time.
    """
    places_by_id = {p.place_id: p for p in places}

    # Build driving-time lookup: (from_id, to_id) → minutes
    driving: dict[tuple[str, str], int] = {}
    for leg in route_legs:
        key = (leg["from_place_id"], leg["to_place_id"])
        driving[key] = int(leg.get("driving_time_minutes", 20))

    sh, sm = map(int, start_time.split(":"))
    eh, em = map(int, end_time.split(":"))
    cursor = sh * 60 + sm
    end_minutes = eh * 60 + em

    items: list[TimelineItemOut] = []

    for i, pid in enumerate(optimized_order):
        place = places_by_id.get(pid)
        if place is None:
            continue

        drive = 0
        if i > 0:
            prev_pid = optimized_order[i - 1]
            drive = driving.get((prev_pid, pid), 20)  # fallback 20 min
            cursor += drive

        arrival = cursor
        departure = arrival + place.stay_duration
        cursor = departure

        items.append(
            TimelineItemOut(
                place_id=pid,
                name=place.name,
                address=place.address,
                lat=place.lat,
                lng=place.lng,
                arrival_time=arrival,
                departure_time=departure,
                stay_duration=place.stay_duration,
                driving_time=drive,
                priority=place.priority.value,
            )
        )

    over_minutes = max(0, cursor - end_minutes)
    return BuiltTimeline(items=items, over_schedule_minutes=over_minutes)
