import type { CartItem, OptimizeRouteResponse, TripConfig } from '@/types/travel';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`API ${path} → ${res.status}: ${text}`);
  }
  // 204 No Content (e.g. DELETE) has no body — return undefined cast to T
  if (res.status === 204 || res.headers.get('content-length') === '0') {
    return undefined as unknown as T;
  }
  return res.json() as Promise<T>;
}

// ── Trips ─────────────────────────────────────────────────────────────────────

export interface TripRecord {
  id: string;
  trip_name: string;
  country_of_stay: string;
  total_days: number;
  created_at: string;
}

export interface PlaceRecord {
  id: string;
  trip_id: string;
  place_id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  stay_duration: number;
  priority: string;
}

export async function listTrips(): Promise<TripRecord[]> {
  return request('/api/trips');
}

export async function getTrip(tripId: string): Promise<TripRecord> {
  return request(`/api/trips/${tripId}`);
}

export async function getTripPlaces(tripId: string): Promise<PlaceRecord[]> {
  return request(`/api/trips/${tripId}/places`);
}

export async function createTrip(
  config: Pick<TripConfig, 'tripName' | 'countryOfStay' | 'tripDays'>,
): Promise<{ id: string }> {
  return request('/api/trips', {
    method: 'POST',
    body: JSON.stringify({
      trip_name: config.tripName,
      country_of_stay: config.countryOfStay,
      total_days: config.tripDays,
    }),
  });
}

export interface ItineraryItemRecord {
  id: string;
  itinerary_id: string;
  place_id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  arrival_time: number;
  departure_time: number;
  stay_duration: number;
  driving_time: number;
  order_index: number;
  priority: string;
  notes?: string;
  is_manual_override: boolean;
}

export interface ItineraryRecord {
  id: string;
  trip_id: string;
  day: number;
  start_time: string;
  end_time: string;
  is_optimized: boolean;
  over_schedule_minutes: number;
  items: ItineraryItemRecord[];
}

export async function getTripItinerary(
  tripId: string,
  day = 1,
): Promise<ItineraryRecord | null> {
  try {
    return await request<ItineraryRecord>(`/api/trips/${tripId}/itinerary?day=${day}`);
  } catch {
    return null;
  }
}

/** Fetch all days' itineraries for a trip in one call. */
export async function getAllTripItineraries(
  tripId: string,
): Promise<ItineraryRecord[]> {
  try {
    return await request<ItineraryRecord[]>(`/api/trips/${tripId}/itineraries`);
  } catch {
    return [];
  }
}

export async function addPlaceToTrip(
  tripId: string,
  place: {
    place_id: string; name: string; address: string;
    lat: number; lng: number; stay_duration: number; priority: string;
  },
): Promise<void> {
  return request(`/api/trips/${tripId}/places`, {
    method: 'POST',
    body: JSON.stringify(place),
  });
}

export async function deleteTrip(tripId: string): Promise<void> {
  return request(`/api/trips/${tripId}`, { method: 'DELETE' });
}

// ── Route Optimization ────────────────────────────────────────────────────────

export async function optimizeRoute(payload: {
  tripId: string | null;
  day: number;
  places: CartItem[];
  startTime: string;
  endTime: string;
  countryOfStay: string;
}): Promise<OptimizeRouteResponse> {
  return request('/api/optimize-route', {
    method: 'POST',
    body: JSON.stringify({
      trip_id: payload.tripId,
      day: payload.day,
      places: payload.places.map(p => ({
        place_id: p.id,
        name: p.name,
        address: p.address,
        lat: p.lat,
        lng: p.lng,
        stay_duration: p.stayDuration,
        priority: p.priority,
      })),
      start_time: payload.startTime,
      end_time: payload.endTime,
      country_of_stay: payload.countryOfStay,
    }),
  });
}

// ── Itinerary manual override ─────────────────────────────────────────────────

export async function patchItineraryItem(
  tripId: string,
  itemId: string,
  patch: { arrival_time?: number; stay_duration?: number; notes?: string },
): Promise<void> {
  return request(`/api/trips/${tripId}/itinerary/items/${itemId}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}
