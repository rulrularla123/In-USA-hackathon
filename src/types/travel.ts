export type Priority = 'Meal' | 'Favorite' | 'Normal';
export type ActiveTab = 'trips' | 'map' | 'plan';

export interface Place {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  kind?: string;
}

export interface CartItem extends Place {
  stayDuration: number; // minutes
  priority: Priority;
  mealStartTime?: string; // "HH:MM" — only used when priority === 'Meal'
  mealEndTime?: string;   // "HH:MM" — only used when priority === 'Meal'
}

export interface TimelineItem extends CartItem {
  arrival: number;           // minutes from midnight
  depart: number;            // minutes from midnight
  travel: number;            // driving minutes from previous stop (Claude estimate)
  isManualOverride?: boolean;
}

// Backend /api/optimize-route response shape
export interface OptimizeRouteResponse {
  optimized_order: string[];
  timeline: BackendTimelineItem[];
  over_schedule_minutes: number;
  total_driving_time_minutes: number;
  reasoning: string;
}

export interface BackendTimelineItem {
  place_id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  arrival_time: number;
  departure_time: number;
  stay_duration: number;
  driving_time: number;
  priority: string;
  is_manual_override: boolean;
}

export interface ActiveHours {
  startTime: string; // "HH:MM"
  endTime: string;   // "HH:MM"
}

export interface PriorityMeta {
  label: string;
  bg: string;
  fg: string;
  dot: string;
}

export const PRIORITY_META: Record<Priority, PriorityMeta> = {
  Meal:     { label: 'Meal',     bg: '#FEF2F2', fg: '#B91C1C', dot: '#EF4444' },
  Favorite: { label: 'Favorite', bg: '#FFFBEB', fg: '#92400E', dot: '#F59E0B' },
  Normal:   { label: 'Normal',   bg: '#EFF6FF', fg: '#1D4ED8', dot: '#3B82F6' },
};

export const ACCENT = '#2563EB';

export interface MapCenter {
  lat: number;
  lng: number;
  zoom: number;
}

export interface TripConfig {
  tripName: string;
  countryOfStay: string;
  tripDays: number;
  mapCenter: MapCenter;
}
