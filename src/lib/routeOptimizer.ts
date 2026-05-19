import type { CartItem, TimelineItem } from '@/types/travel';

function distKm(a: CartItem, b: CartItem): number {
  const dLat = (a.lat - b.lat) * 111;
  const dLng = (a.lng - b.lng) * 91;
  return Math.sqrt(dLat * dLat + dLng * dLng);
}

export function travelMin(a: CartItem, b: CartItem): number {
  const km = distKm(a, b);
  // Speed tiers based on distance
  if (km < 5)   return Math.round((km / 20)  * 60 + 5);   // urban: 20 km/h + 5 min parking
  if (km < 30)  return Math.round((km / 40)  * 60 + 10);  // suburban: 40 km/h
  if (km < 100) return Math.round((km / 70)  * 60 + 15);  // regional: 70 km/h
  return         Math.round((km / 100) * 60 + 30);         // highway: 100 km/h (Seoul→Busan etc.)
}

// Returns a label for a Meal stop based on its scheduled arrival time
export function mealLabel(arrivalMins: number): string {
  const h = Math.floor(arrivalMins / 60) % 24;
  if (h >= 6  && h < 10) return 'Breakfast';
  if (h >= 11 && h < 15) return 'Lunch';
  if (h >= 17 && h < 22) return 'Dinner';
  return 'Meal';
}

// Nearest-neighbour TSP
// · Favorite places get a 25 % distance discount → selected earlier
// · Meal places get no discount but are considered in standard order
export function optimizeRouteNearestNeighbour(places: CartItem[]): CartItem[] {
  if (places.length <= 1) return places.slice();

  const remaining = [...places];
  const route: CartItem[] = [remaining.shift()!];

  while (remaining.length) {
    const last = route[route.length - 1];
    let bestIdx = 0;
    let bestScore = Infinity;

    remaining.forEach((p, i) => {
      const d = distKm(last, p);
      // Favorites are preferred — multiply distance by 0.75 so they "look closer"
      const score = p.priority === 'Favorite' ? d * 0.75 : d;
      if (score < bestScore) { bestScore = score; bestIdx = i; }
    });

    route.push(remaining.splice(bestIdx, 1)[0]);
  }

  return route;
}

export function buildTimeline(
  orderedPlaces: CartItem[],
  startTime: string,
  endTime: string,
): TimelineItem[] {
  if (!startTime || !endTime || !orderedPlaces.length) return [];
  const [h, m] = startTime.split(':').map(Number);
  let cursor = h * 60 + m;
  return orderedPlaces.map((p, i) => {
    let travel = 0;
    if (i > 0) {
      travel = travelMin(orderedPlaces[i - 1], p);
      cursor += travel;
    }
    const arrival = cursor;
    const depart = cursor + p.stayDuration;
    cursor = depart;
    return { ...p, arrival, depart, travel };
  });
}

export function fmtTime(mins: number): string {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  const period = h >= 12 ? 'PM' : 'AM';
  const hh = ((h + 11) % 12) + 1;
  return `${hh}:${String(m).padStart(2, '0')} ${period}`;
}

export function fmtDuration(mins: number): string {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}
