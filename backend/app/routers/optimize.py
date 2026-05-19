"""Route optimization endpoint — uses Claude as the TSP solver."""

from __future__ import annotations

import logging
import uuid

from fastapi import APIRouter, HTTPException

from app.database import get_supabase
from app.models.schemas import OptimizeRouteRequest, OptimizeRouteResponse, RouteLeg
from app.services.claude_service import optimize_route as claude_optimize
from app.services.local_optimizer import local_optimize
from app.services.timeline import build_timeline

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["optimize"])


@router.post("/optimize-route", response_model=OptimizeRouteResponse)
async def optimize_route(body: OptimizeRouteRequest):
    # ── 1. Validate active hours are present ──────────────────────────────────
    if not body.start_time or not body.end_time:
        raise HTTPException(400, "start_time and end_time (active hours) are required")

    if len(body.places) < 2:
        raise HTTPException(400, "At least 2 places are required for optimization")

    # ── 2. Optimize — Claude first, local algorithm as fallback ──────────────
    used_claude = False
    try:
        claude_result = claude_optimize(
            places=body.places,
            start_time=body.start_time,
            end_time=body.end_time,
            country=body.country_of_stay,
        )
        optimized_order: list[str] = claude_result["optimized_order"]
        raw_legs: list[dict]       = claude_result.get("route_legs", [])
        used_claude = True
    except Exception as exc:
        logger.info("Claude unavailable (%s) — using local TSP", exc)
        optimized_order, raw_legs, _ = local_optimize(body.places)

    # ── 3. Build timed timeline ───────────────────────────────────────────────
    built = build_timeline(
        optimized_order=optimized_order,
        route_legs=raw_legs,
        places=body.places,
        start_time=body.start_time,
        end_time=body.end_time,
    )

    # ── 4. Persist to Supabase (if trip_id provided) ──────────────────────────
    if body.trip_id:
        try:
            _save_itinerary(
                trip_id=body.trip_id,
                day=body.day,
                start_time=body.start_time,
                end_time=body.end_time,
                over_minutes=built.over_schedule_minutes,
                items=built.items,
            )
        except Exception as exc:
            # Non-fatal — log and continue
            logger.warning("Failed to persist itinerary: %s", exc)

    # ── 5. Build response ─────────────────────────────────────────────────────
    route_legs = [
        RouteLeg(
            from_place_id=leg["from_place_id"],
            to_place_id=leg["to_place_id"],
            driving_time_minutes=int(leg.get("driving_time_minutes", 0)),
            distance_km=float(leg.get("distance_km", 0)),
        )
        for leg in raw_legs
    ]

    total_drive = sum(leg.get("driving_time_minutes", 0) for leg in raw_legs)
    reasoning   = claude_result.get("reasoning", "") if used_claude else "Local nearest-neighbour TSP"

    return OptimizeRouteResponse(
        optimized_order=optimized_order,
        timeline=built.items,
        over_schedule_minutes=built.over_schedule_minutes,
        total_driving_time_minutes=int(total_drive),
        reasoning=str(reasoning),
        route_legs=route_legs,
    )


# ── DB helper ─────────────────────────────────────────────────────────────────

def _save_itinerary(
    trip_id: str,
    day: int,
    start_time: str,
    end_time: str,
    over_minutes: int,
    items: list,
) -> None:
    db = get_supabase()

    # Delete the existing itinerary for this trip+day (idempotent re-optimize)
    old = (
        db.table("itineraries")
        .select("id")
        .eq("trip_id", trip_id)
        .eq("day", day)
        .execute()
    )
    for row in old.data or []:
        db.table("itinerary_items").delete().eq("itinerary_id", row["id"]).execute()
        db.table("itineraries").delete().eq("id", row["id"]).execute()

    itinerary_id = str(uuid.uuid4())
    db.table("itineraries").insert(
        {
            "id": itinerary_id,
            "trip_id": trip_id,
            "day": day,
            "start_time": start_time,
            "end_time": end_time,
            "is_optimized": True,
            "over_schedule_minutes": over_minutes,
        }
    ).execute()

    rows = [
        {
            "id": str(uuid.uuid4()),
            "itinerary_id": itinerary_id,
            "place_id": item.place_id,
            "name": item.name,
            "address": item.address,
            "lat": item.lat,
            "lng": item.lng,
            "arrival_time": item.arrival_time,
            "departure_time": item.departure_time,
            "stay_duration": item.stay_duration,
            "driving_time": item.driving_time,
            "order_index": i,
            "priority": item.priority,
        }
        for i, item in enumerate(items)
    ]
    if rows:
        db.table("itinerary_items").insert(rows).execute()
