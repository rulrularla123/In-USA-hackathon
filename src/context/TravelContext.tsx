'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import { toast } from 'sonner';
import type {
  ActiveHours,
  ActiveTab,
  BackendTimelineItem,
  CartItem,
  Place,
  Priority,
  TimelineItem,
  TripConfig,
} from '@/types/travel';
import { buildTimeline, optimizeRouteNearestNeighbour } from '@/lib/routeOptimizer';
import { getCountryCenter } from '@/lib/countryCenters';
import * as api from '@/lib/api';

// ── Per-day state ─────────────────────────────────────────────────────────────

interface DayState {
  placeCart: CartItem[];
  activeHours: ActiveHours;
  isOptimized: boolean;
  orderedIds: string[];
  manualTimeline: TimelineItem[] | null;
}

const DEFAULT_DAY: DayState = {
  placeCart: [],
  activeHours: { startTime: '', endTime: '' },
  isOptimized: false,
  orderedIds: [],
  manualTimeline: null,
};

// ── Context interface ─────────────────────────────────────────────────────────

interface TravelContextValue {
  tripId: string | null;
  tripConfig: TripConfig | null;
  activeTab: ActiveTab;
  selectedDay: number;
  isOptimizing: boolean;
  notes: Record<string, string>;
  sheetOpen: boolean;
  // Current-day derived (isolated per day)
  placeCart: CartItem[];
  activeHours: ActiveHours;
  isOptimized: boolean;
  displayTimeline: TimelineItem[];
  overScheduleMinutes: number;
  // Actions
  setTripConfig: (config: TripConfig) => Promise<void>;
  loadTrip: (tripId: string) => Promise<void>;
  setActiveTab: (tab: ActiveTab) => void;
  setSelectedDay: (day: number) => void;
  setActiveHours: (hours: ActiveHours | ((prev: ActiveHours) => ActiveHours)) => void;
  addPlace: (place: Place) => void;
  removePlace: (id: string) => void;
  updatePlaceSettings: (id: string, patch: Partial<Pick<CartItem, 'stayDuration' | 'priority' | 'mealStartTime' | 'mealEndTime'>>) => void;
  optimizeRoute: () => Promise<void>;
  updateTimelineItem: (id: string, patch: { arrival?: number; stayDuration?: number }) => void;
  resetCart: () => void;
  setNote: (id: string, note: string) => void;
  setSheetOpen: (open: boolean) => void;
}

const TravelContext = createContext<TravelContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────────

export function TravelProvider({ children }: { children: React.ReactNode }) {
  const [tripId, setTripId] = useState<string | null>(null);
  const [tripConfig, setTripConfigState] = useState<TripConfig | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('trips');
  const [selectedDay, setSelectedDay] = useState(1);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [sheetOpen, setSheetOpen] = useState(true);
  const [allDays, setAllDays] = useState<Record<number, DayState>>({});

  // ── Stable refs — always reflect latest state without stale closures ──────
  // Assigned during render so always current when callbacks execute
  const selectedDayRef = useRef(selectedDay);
  selectedDayRef.current = selectedDay;

  const allDaysRef = useRef(allDays);
  allDaysRef.current = allDays;

  // ── Core per-day patcher — stable (uses functional setState) ─────────────
  const patchDay = useCallback((day: number, fn: (prev: DayState) => DayState) => {
    setAllDays(prev => ({ ...prev, [day]: fn(prev[day] ?? DEFAULT_DAY) }));
  }, []);

  // ── Current-day derived values ────────────────────────────────────────────
  const currentDay = allDays[selectedDay] ?? DEFAULT_DAY;

  const optimizedTimeline = useMemo<TimelineItem[]>(() => {
    const d = currentDay;
    if (!d.isOptimized || d.orderedIds.length === 0) return [];
    const ordered = d.orderedIds
      .map(id => d.placeCart.find(p => p.id === id))
      .filter((p): p is CartItem => p !== undefined);
    return buildTimeline(ordered, d.activeHours.startTime, d.activeHours.endTime);
  }, [currentDay]);

  const displayTimeline = useMemo(
    () => currentDay.manualTimeline ?? optimizedTimeline,
    [currentDay.manualTimeline, optimizedTimeline],
  );

  const displayTimelineRef = useRef<TimelineItem[]>([]);
  displayTimelineRef.current = displayTimeline;

  const overScheduleMinutes = useMemo(() => {
    const endTime = currentDay.activeHours.endTime;
    if (!endTime || displayTimeline.length === 0) return 0;
    const [eh, em] = endTime.split(':').map(Number);
    return Math.max(0, displayTimeline[displayTimeline.length - 1].depart - (eh * 60 + em));
  }, [displayTimeline, currentDay.activeHours.endTime]);

  // ── Trip setup ────────────────────────────────────────────────────────────

  const setTripConfig = useCallback(async (config: TripConfig) => {
    setTripConfigState(config);
    setAllDays({});
    setSelectedDay(1);
    setActiveTab('map');
    try {
      const trip = await api.createTrip(config);
      setTripId(trip.id);
    } catch { /* backend unavailable — local-only mode */ }
  }, []);

  const loadTrip = useCallback(async (id: string) => {
    try {
      const [trip, itineraries] = await Promise.all([
        api.getTrip(id),
        api.getAllTripItineraries(id),
      ]);

      // ── Build all day states in one pass ──────────────────────────────────
      // Using a local object avoids the "multiple patchDay calls in a loop"
      // batching edge-case and gives us a single atomic setAllDays() call.
      const newDays: Record<number, DayState> = {};

      if (itineraries.length > 0) {
        for (const itin of itineraries) {
          if (itin.items.length === 0) {
            // Itinerary header exists but no items — restore active hours only
            newDays[itin.day] = {
              ...DEFAULT_DAY,
              activeHours: { startTime: itin.start_time, endTime: itin.end_time },
            };
            continue;
          }

          const placeCart: CartItem[] = itin.items.map(item => ({
            id:           item.place_id,
            name:         item.name,
            address:      item.address,
            lat:          item.lat,
            lng:          item.lng,
            stayDuration: item.stay_duration,
            priority:     item.priority as Priority,
          }));

          const manualTimeline: TimelineItem[] = itin.items.map(item => ({
            id:               item.place_id,
            name:             item.name,
            address:          item.address,
            lat:              item.lat,
            lng:              item.lng,
            stayDuration:     item.stay_duration,
            priority:         item.priority as Priority,
            arrival:          item.arrival_time,
            depart:           item.departure_time,
            travel:           item.driving_time,
            isManualOverride: item.is_manual_override,
          }));

          newDays[itin.day] = {
            placeCart,
            activeHours:    { startTime: itin.start_time, endTime: itin.end_time },
            isOptimized:    true,
            orderedIds:     itin.items.map(item => item.place_id),
            manualTimeline,
          };
        }
      } else {
        // No itineraries at all — load raw place_cart into Day 1
        const places = await api.getTripPlaces(id);
        if (places.length > 0) {
          newDays[1] = {
            ...DEFAULT_DAY,
            placeCart: places.map(p => ({
              id:           p.place_id,
              name:         p.name,
              address:      p.address,
              lat:          p.lat,
              lng:          p.lng,
              stayDuration: p.stay_duration,
              priority:     p.priority as Priority,
            })),
          };
        }
      }

      // ── Apply everything in one synchronous batch ─────────────────────────
      setTripConfigState({
        tripName:      trip.trip_name,
        countryOfStay: trip.country_of_stay,
        tripDays:      trip.total_days,
        mapCenter:     getCountryCenter(trip.country_of_stay),
      });
      setTripId(id);
      setAllDays(newDays);   // single call — atomic
      setSelectedDay(1);
      setActiveTab('map');
    } catch (err) {
      console.error('[loadTrip]', err);
      toast.error('Failed to load trip');
    }
  }, []);

  // ── Place actions — use refs to avoid stale closures ─────────────────────

  const addPlace = useCallback((place: Place) => {
    patchDay(selectedDayRef.current, prev => {
      if (prev.placeCart.some(x => x.id === place.id)) return prev;
      return {
        ...prev,
        placeCart: [
          ...prev.placeCart,
          {
            ...place,
            stayDuration: 60,
            priority: (place.kind === 'Food' ? 'Meal' : 'Normal') as Priority,
          },
        ],
        isOptimized: false,
        manualTimeline: null,
      };
    });
  }, [patchDay]);

  const removePlace = useCallback((id: string) => {
    patchDay(selectedDayRef.current, prev => ({
      ...prev,
      placeCart: prev.placeCart.filter(p => p.id !== id),
      isOptimized: false,
      manualTimeline: null,
    }));
  }, [patchDay]);

  const updatePlaceSettings = useCallback(
    (id: string, patch: Partial<Pick<CartItem, 'stayDuration' | 'priority' | 'mealStartTime' | 'mealEndTime'>>) => {
      patchDay(selectedDayRef.current, prev => ({
        ...prev,
        placeCart: prev.placeCart.map(p => (p.id === id ? { ...p, ...patch } : p)),
        isOptimized: false,
        manualTimeline: null,
      }));
    },
    [patchDay],
  );

  const setActiveHours = useCallback(
    (hoursOrFn: ActiveHours | ((prev: ActiveHours) => ActiveHours)) => {
      patchDay(selectedDayRef.current, prev => ({
        ...prev,
        activeHours:
          typeof hoursOrFn === 'function' ? hoursOrFn(prev.activeHours) : hoursOrFn,
      }));
    },
    [patchDay],
  );

  // ── Route optimization ────────────────────────────────────────────────────

  const optimizeRoute = useCallback(async () => {
    const day = selectedDayRef.current;
    const dayState = allDaysRef.current[day] ?? DEFAULT_DAY;

    if (!dayState.activeHours.startTime || !dayState.activeHours.endTime) {
      toast.warning('Set active hours before optimizing');
      return;
    }
    if (dayState.placeCart.length < 2) {
      toast.warning('Add at least 2 places to optimize');
      return;
    }

    setIsOptimizing(true);

    // ── Persist cart places to Supabase before optimizing ────────────────────
    // This ensures loadTrip() can restore them on the next session.
    if (tripId) {
      try {
        await Promise.all(
          dayState.placeCart.map(p =>
            api.addPlaceToTrip(tripId, {
              place_id:     p.id,
              name:         p.name,
              address:      p.address,
              lat:          p.lat,
              lng:          p.lng,
              stay_duration: p.stayDuration,
              priority:     p.priority,
            }),
          ),
        );
      } catch { /* non-fatal — continue with optimization */ }
    }

    try {
      const result = await api.optimizeRoute({
        tripId: tripId,
        day,                                      // ← pass the actual day
        places: dayState.placeCart,
        startTime: dayState.activeHours.startTime,
        endTime: dayState.activeHours.endTime,
        countryOfStay: tripConfig?.countryOfStay ?? '',
      });

      const timeline: TimelineItem[] = result.timeline.map((item: BackendTimelineItem) => ({
        id: item.place_id,
        name: item.name,
        address: item.address,
        lat: item.lat,
        lng: item.lng,
        stayDuration: item.stay_duration,
        priority: item.priority as Priority,
        arrival: item.arrival_time,
        depart: item.departure_time,
        travel: item.driving_time,
        kind: dayState.placeCart.find(p => p.id === item.place_id)?.kind,
      }));

      patchDay(day, prev => ({
        ...prev,
        orderedIds: result.optimized_order,
        manualTimeline: timeline,
        isOptimized: true,
      }));
      setSheetOpen(false);
      setTimeout(() => setActiveTab('plan'), 320);
    } catch {
      toast.info('Using local route optimization', { duration: 3000 });
      const ordered = optimizeRouteNearestNeighbour(dayState.placeCart);
      patchDay(day, prev => ({
        ...prev,
        orderedIds: ordered.map(p => p.id),
        manualTimeline: null,
        isOptimized: true,
      }));
      setSheetOpen(false);
      setTimeout(() => setActiveTab('plan'), 320);
    } finally {
      setIsOptimizing(false);
    }
  }, [tripId, tripConfig, patchDay]);

  // ── Manual timeline edits ─────────────────────────────────────────────────

  const updateTimelineItem = useCallback(
    (id: string, patch: { arrival?: number; stayDuration?: number }) => {
      const day = selectedDayRef.current;
      const updated = displayTimelineRef.current.map(item => {
        if (item.id !== id) return item;
        const a = patch.arrival ?? item.arrival;
        const s = patch.stayDuration ?? item.stayDuration;
        return { ...item, arrival: a, stayDuration: s, depart: a + s, isManualOverride: true };
      });
      patchDay(day, prev => ({ ...prev, manualTimeline: updated }));
    },
    [patchDay],
  );

  const resetCart = useCallback(() => {
    patchDay(selectedDayRef.current, () => DEFAULT_DAY);
  }, [patchDay]);

  const setNote = useCallback((id: string, note: string) => {
    setNotes(n => ({ ...n, [id]: note }));
  }, []);

  const value: TravelContextValue = {
    tripId, tripConfig, activeTab, selectedDay, isOptimizing, notes, sheetOpen,
    placeCart: currentDay.placeCart,
    activeHours: currentDay.activeHours,
    isOptimized: currentDay.isOptimized,
    displayTimeline,
    overScheduleMinutes,
    setTripConfig, loadTrip, setActiveTab, setSelectedDay, setActiveHours,
    addPlace, removePlace, updatePlaceSettings,
    optimizeRoute, updateTimelineItem, resetCart, setNote, setSheetOpen,
  };

  return <TravelContext.Provider value={value}>{children}</TravelContext.Provider>;
}

export function useTravelContext(): TravelContextValue {
  const ctx = useContext(TravelContext);
  if (!ctx) throw new Error('useTravelContext must be used inside <TravelProvider>');
  return ctx;
}
