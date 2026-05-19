"""Claude API integration for TSP route optimization with driving time estimation."""

from __future__ import annotations

import json
import logging
from typing import Any

import anthropic

from app.config import settings
from app.models.schemas import PlaceIn, RouteLeg

logger = logging.getLogger(__name__)

_client: anthropic.Anthropic | None = None


def _get_client() -> anthropic.Anthropic:
    global _client
    if not settings.anthropic_api_key:
        raise RuntimeError("ANTHROPIC_API_KEY is not configured in backend/.env")
    if _client is None:
        _client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
    return _client


# ── Tool schema for structured output ────────────────────────────────────────

_OPTIMIZE_TOOL: dict[str, Any] = {
    "name": "submit_optimized_route",
    "description": (
        "Submit the TSP-optimized visit order with per-leg driving time estimates. "
        "All place_ids must come from the input list."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "optimized_order": {
                "type": "array",
                "items": {"type": "string"},
                "description": "All input place_ids sorted into the optimal visit order.",
            },
            "route_legs": {
                "type": "array",
                "description": "One entry per consecutive pair in optimized_order.",
                "items": {
                    "type": "object",
                    "required": ["from_place_id", "to_place_id", "driving_time_minutes"],
                    "properties": {
                        "from_place_id": {"type": "string"},
                        "to_place_id": {"type": "string"},
                        "driving_time_minutes": {
                            "type": "integer",
                            "description": "Realistic city/suburban driving time including parking buffer (5 min).",
                        },
                        "distance_km": {"type": "number"},
                    },
                },
            },
            "total_driving_time_minutes": {
                "type": "integer",
                "description": "Sum of all leg driving times.",
            },
            "reasoning": {
                "type": "string",
                "description": "1-2 sentences explaining key optimization decisions.",
            },
        },
        "required": ["optimized_order", "route_legs", "total_driving_time_minutes", "reasoning"],
    },
}

# ── System prompt (cached) ────────────────────────────────────────────────────

_SYSTEM_PROMPT = (
    "You are an expert travel route optimizer specialized in minimizing total car driving time "
    "between tourist destinations. You use the Traveling Salesman Problem nearest-neighbor "
    "heuristic as a baseline, then refine it using geographic intuition.\n\n"
    "Driving time estimation rules:\n"
    "- Urban core (< 3 km apart): 5-15 min (dense traffic + parking)\n"
    "- Suburban / mid-city (3-10 km): 15-30 min\n"
    "- Cross-city (10-25 km): 30-55 min\n"
    "- Always add 5 min parking buffer per stop\n"
    "- Apply regional multipliers: Tokyo/Seoul/Beijing ×1.4 (heavy congestion), "
    "European capitals ×1.2, US cities ×1.0\n\n"
    "Priority constraints:\n"
    "- 'Meal' places should land near 11:30-14:00 (lunch) or 17:30-21:00 (dinner)\n"
    "- 'Favorite' places are flexible but should not be first or last if avoidable\n"
    "- 'Normal' places fill gaps efficiently\n\n"
    "Always include every place_id exactly once in optimized_order."
)


# ── Main function ─────────────────────────────────────────────────────────────

def optimize_route(
    places: list[PlaceIn],
    start_time: str,
    end_time: str,
    country: str,
) -> dict[str, Any]:
    """
    Call Claude to TSP-optimize the route and estimate driving times.
    Returns the raw tool-call input dict.
    Raises on API or validation errors.
    """
    places_payload = [
        {
            "place_id": p.place_id,
            "name": p.name,
            "address": p.address,
            "coordinates": {"lat": round(p.lat, 6), "lng": round(p.lng, 6)},
            "stay_duration_minutes": p.stay_duration,
            "priority": p.priority.value,
        }
        for p in places
    ]

    user_prompt = (
        f"Optimize this trip in {country}.\n"
        f"Active travel window: {start_time} → {end_time}\n\n"
        f"Places to visit:\n{json.dumps(places_payload, ensure_ascii=False, indent=2)}\n\n"
        "Use the submit_optimized_route tool to return your answer."
    )

    client = _get_client()

    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        system=[
            {
                "type": "text",
                "text": _SYSTEM_PROMPT,
                "cache_control": {"type": "ephemeral"},  # prompt caching
            }
        ],
        tools=[_OPTIMIZE_TOOL],
        tool_choice={"type": "tool", "name": "submit_optimized_route"},
        messages=[{"role": "user", "content": user_prompt}],
    )

    # Extract tool-call result
    tool_block = next(
        (b for b in response.content if b.type == "tool_use"),
        None,
    )
    if tool_block is None:
        raise ValueError("Claude did not return a tool_use block")

    result: dict[str, Any] = tool_block.input  # type: ignore[attr-defined]

    # Validate that every input place_id appears in optimized_order
    input_ids = {p.place_id for p in places}
    output_ids = set(result.get("optimized_order", []))
    missing = input_ids - output_ids
    if missing:
        logger.warning("Claude omitted place_ids %s — appending them", missing)
        result["optimized_order"] = result["optimized_order"] + list(missing)

    return result
