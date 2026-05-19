from __future__ import annotations

from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field


class Priority(str, Enum):
    MEAL = "Meal"
    FAVORITE = "Favorite"
    NORMAL = "Normal"


# ── Trip ──────────────────────────────────────────────────────────────────────

class TripCreate(BaseModel):
    trip_name: str = Field(min_length=1, max_length=120)
    country_of_stay: str = Field(min_length=1, max_length=80)
    total_days: int = Field(default=3, ge=1, le=33)


class TripUpdate(BaseModel):
    trip_name: Optional[str] = Field(default=None, max_length=120)
    country_of_stay: Optional[str] = Field(default=None, max_length=80)
    total_days: Optional[int] = Field(default=None, ge=1, le=14)


class TripResponse(BaseModel):
    id: str
    trip_name: str
    country_of_stay: str
    total_days: int
    created_at: str


# ── Place ─────────────────────────────────────────────────────────────────────

class PlaceIn(BaseModel):
    place_id: str                                          # Google Place ID
    name: str
    address: str = ""
    lat: float
    lng: float
    stay_duration: int = Field(default=60, ge=15, le=720)  # minutes
    priority: Priority = Priority.NORMAL


class PlaceResponse(BaseModel):
    id: str
    trip_id: str
    place_id: str
    name: str
    address: str
    lat: float
    lng: float
    stay_duration: int
    priority: str
    created_at: str


# ── Route Optimization ────────────────────────────────────────────────────────

class OptimizeRouteRequest(BaseModel):
    trip_id: Optional[str] = None
    day: int = Field(default=1, ge=1)          # which day is being optimized
    places: list[PlaceIn] = Field(min_length=2)
    start_time: str = Field(pattern=r"^\d{2}:\d{2}$")   # "HH:MM"
    end_time: str = Field(pattern=r"^\d{2}:\d{2}$")
    country_of_stay: str


class RouteLeg(BaseModel):
    from_place_id: str
    to_place_id: str
    driving_time_minutes: int
    distance_km: float = 0.0


class TimelineItemOut(BaseModel):
    place_id: str
    name: str
    address: str
    lat: float
    lng: float
    arrival_time: int      # minutes from midnight
    departure_time: int
    stay_duration: int
    driving_time: int      # from previous stop (Claude estimate)
    priority: str
    is_manual_override: bool = False


class OptimizeRouteResponse(BaseModel):
    optimized_order: list[str]
    timeline: list[TimelineItemOut]
    over_schedule_minutes: int
    total_driving_time_minutes: int
    reasoning: str
    route_legs: list[RouteLeg]


# ── Manual Override ───────────────────────────────────────────────────────────

class ItineraryItemUpdate(BaseModel):
    arrival_time: Optional[int] = None     # minutes from midnight
    stay_duration: Optional[int] = None
    notes: Optional[str] = None
