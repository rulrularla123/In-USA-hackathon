"""CRUD endpoints for trips and place cart."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, HTTPException

from app.database import get_supabase
from app.models.schemas import (
    PlaceIn,
    PlaceResponse,
    TripCreate,
    TripResponse,
    TripUpdate,
)

router = APIRouter(prefix="/api/trips", tags=["trips"])


# ── Trip CRUD ─────────────────────────────────────────────────────────────────

@router.get("", response_model=list[TripResponse])
async def list_trips():
    db = get_supabase()
    result = db.table("trips").select("*").order("created_at", desc=True).execute()
    return result.data or []


@router.post("", response_model=TripResponse, status_code=201)
async def create_trip(body: TripCreate):
    db = get_supabase()
    data = {
        "id": str(uuid.uuid4()),
        "trip_name": body.trip_name,
        "country_of_stay": body.country_of_stay,
        "total_days": body.total_days,
    }
    result = db.table("trips").insert(data).execute()
    if not result.data:
        raise HTTPException(500, "Failed to create trip")
    return result.data[0]


@router.get("/{trip_id}", response_model=TripResponse)
async def get_trip(trip_id: str):
    db = get_supabase()
    result = db.table("trips").select("*").eq("id", trip_id).execute()
    if not result.data:
        raise HTTPException(404, "Trip not found")
    return result.data[0]


@router.patch("/{trip_id}", response_model=TripResponse)
async def update_trip(trip_id: str, body: TripUpdate):
    updates = body.model_dump(exclude_none=True)
    if not updates:
        raise HTTPException(400, "No fields to update")
    db = get_supabase()
    result = db.table("trips").update(updates).eq("id", trip_id).execute()
    if not result.data:
        raise HTTPException(404, "Trip not found")
    return result.data[0]


@router.delete("/{trip_id}", status_code=204)
async def delete_trip(trip_id: str):
    db = get_supabase()
    db.table("trips").delete().eq("id", trip_id).execute()


# ── Place Cart ────────────────────────────────────────────────────────────────

@router.get("/{trip_id}/places", response_model=list[PlaceResponse])
async def list_places(trip_id: str):
    db = get_supabase()
    result = (
        db.table("place_cart")
        .select("*")
        .eq("trip_id", trip_id)
        .order("created_at")
        .execute()
    )
    return result.data


@router.post("/{trip_id}/places", response_model=PlaceResponse, status_code=201)
async def add_place(trip_id: str, body: PlaceIn):
    db = get_supabase()
    # Upsert by (trip_id, place_id) to avoid duplicates
    existing = (
        db.table("place_cart")
        .select("id")
        .eq("trip_id", trip_id)
        .eq("place_id", body.place_id)
        .execute()
    )
    if existing.data:
        return existing.data[0]

    data = {
        "id": str(uuid.uuid4()),
        "trip_id": trip_id,
        "place_id": body.place_id,
        "name": body.name,
        "address": body.address,
        "lat": body.lat,
        "lng": body.lng,
        "stay_duration": body.stay_duration,
        "priority": body.priority.value,
    }
    result = db.table("place_cart").insert(data).execute()
    if not result.data:
        raise HTTPException(500, "Failed to add place")
    return result.data[0]


@router.delete("/{trip_id}/places/{place_id}", status_code=204)
async def remove_place(trip_id: str, place_id: str):
    db = get_supabase()
    db.table("place_cart").delete().eq("trip_id", trip_id).eq("place_id", place_id).execute()


# ── Itinerary read ───────────────────────────────────────────────────────────

@router.get("/{trip_id}/itinerary")
async def get_itinerary(trip_id: str, day: int = 1):
    """Return one day's itinerary (header + ordered items)."""
    db = get_supabase()
    itin = (
        db.table("itineraries")
        .select("*")
        .eq("trip_id", trip_id)
        .eq("day", day)
        .execute()
    )
    if not itin.data:
        return None
    header = itin.data[0]
    items = (
        db.table("itinerary_items")
        .select("*")
        .eq("itinerary_id", header["id"])
        .order("order_index")
        .execute()
    )
    return {**header, "items": items.data or []}


@router.get("/{trip_id}/itineraries")
async def get_all_itineraries(trip_id: str):
    """Return ALL days' itineraries for a trip (each with their items)."""
    db = get_supabase()
    itins = (
        db.table("itineraries")
        .select("*")
        .eq("trip_id", trip_id)
        .order("day")
        .execute()
    )
    if not itins.data:
        return []

    result = []
    for itin in itins.data:
        items = (
            db.table("itinerary_items")
            .select("*")
            .eq("itinerary_id", itin["id"])
            .order("order_index")
            .execute()
        )
        result.append({**itin, "items": items.data or []})
    return result


# ── Itinerary manual override ─────────────────────────────────────────────────

@router.patch("/{trip_id}/itinerary/items/{item_id}", status_code=200)
async def update_itinerary_item(trip_id: str, item_id: str, body: dict):
    """
    Accepts partial updates: arrival_time, stay_duration, notes.
    Recalculates departure_time = arrival_time + stay_duration if either changes.
    """
    allowed = {"arrival_time", "stay_duration", "notes"}
    updates = {k: v for k, v in body.items() if k in allowed}
    if not updates:
        raise HTTPException(400, "No valid fields to update")

    db = get_supabase()
    # Read current values to recalculate departure if needed
    current = (
        db.table("itinerary_items").select("arrival_time,stay_duration").eq("id", item_id).execute()
    )
    if not current.data:
        raise HTTPException(404, "Itinerary item not found")

    row = current.data[0]
    arrival = updates.get("arrival_time", row["arrival_time"])
    stay = updates.get("stay_duration", row["stay_duration"])
    updates["departure_time"] = arrival + stay
    updates["is_manual_override"] = True

    result = db.table("itinerary_items").update(updates).eq("id", item_id).execute()
    return result.data[0] if result.data else {}
