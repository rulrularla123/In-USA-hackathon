import type { MapCenter } from '@/types/travel';

const CENTERS: Record<string, MapCenter> = {
  japan:            { lat: 35.6762, lng: 139.6503, zoom: 12 },
  'south korea':    { lat: 37.5665, lng: 126.9780, zoom: 12 },
  korea:            { lat: 37.5665, lng: 126.9780, zoom: 12 },
  'united states':  { lat: 40.7128, lng: -74.0060, zoom: 11 },
  usa:              { lat: 40.7128, lng: -74.0060, zoom: 11 },
  france:           { lat: 48.8566, lng:   2.3522, zoom: 12 },
  'united kingdom': { lat: 51.5074, lng:  -0.1278, zoom: 11 },
  uk:               { lat: 51.5074, lng:  -0.1278, zoom: 11 },
  germany:          { lat: 52.5200, lng:  13.4050, zoom: 12 },
  italy:            { lat: 41.9028, lng:  12.4964, zoom: 12 },
  spain:            { lat: 40.4168, lng:  -3.7038, zoom: 12 },
  china:            { lat: 39.9042, lng: 116.4074, zoom: 12 },
  thailand:         { lat: 13.7563, lng: 100.5018, zoom: 12 },
  singapore:        { lat:  1.3521, lng: 103.8198, zoom: 13 },
  australia:        { lat: -33.8688, lng: 151.2093, zoom: 11 },
  canada:           { lat: 43.6532, lng:  -79.3832, zoom: 11 },
  taiwan:           { lat: 25.0330, lng: 121.5654, zoom: 12 },
  vietnam:          { lat: 21.0285, lng: 105.8542, zoom: 12 },
  indonesia:        { lat: -6.2088, lng: 106.8456, zoom: 11 },
  portugal:         { lat: 38.7169, lng:  -9.1399, zoom: 12 },
  netherlands:      { lat: 52.3676, lng:   4.9041, zoom: 12 },
};

const DEFAULT_CENTER: MapCenter = { lat: 20, lng: 0, zoom: 2 };

export function getCountryCenter(country: string): MapCenter {
  const key = country.toLowerCase().trim();
  if (CENTERS[key]) return CENTERS[key];
  // partial match (e.g. "republic of korea" → "korea")
  for (const [k, v] of Object.entries(CENTERS)) {
    if (key.includes(k) || k.includes(key)) return v;
  }
  return DEFAULT_CENTER;
}

// Returns true if the Google address_components country matches the user's country of stay
export function isSameCountry(
  placeCountryLong: string,  // e.g. "Japan"
  placeCountryCode: string,  // e.g. "JP"
  stayCountry: string,        // e.g. "Japan"  (user input)
): boolean {
  const norm = (s: string) => s.toLowerCase().trim();
  const stay = norm(stayCountry);
  const long = norm(placeCountryLong);
  const code = norm(placeCountryCode);

  if (long === stay || code === stay) return true;
  if (long.includes(stay) || stay.includes(long)) return true;

  // ISO → common aliases
  const aliases: Record<string, string[]> = {
    kr: ['korea', 'south korea', 'republic of korea'],
    jp: ['japan'],
    us: ['united states', 'usa', 'america'],
    gb: ['united kingdom', 'uk', 'britain', 'england'],
    cn: ['china'],
    tw: ['taiwan'],
  };
  return (aliases[code] ?? []).some(a => stay.includes(a) || a.includes(stay));
}
