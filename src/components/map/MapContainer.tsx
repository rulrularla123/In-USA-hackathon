'use client';

import { useEffect, useMemo } from 'react';
import { Map, AdvancedMarker, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import { useTravelContext } from '@/context/TravelContext';
import { ACCENT, PRIORITY_META } from '@/types/travel';
import type { CartItem } from '@/types/travel';

const DEFAULT_CENTER = { lat: 20, lng: 0 };
const DEFAULT_ZOOM   = 2;
const MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID ?? 'DEMO_MAP_ID';

export default function MapContainer() {
  const { placeCart, isOptimized, displayTimeline, tripConfig } = useTravelContext();
  const map = useMap('main-map');

  useEffect(() => {
    if (!map || !tripConfig?.mapCenter) return;
    map.panTo({ lat: tripConfig.mapCenter.lat, lng: tripConfig.mapCenter.lng });
    map.setZoom(tripConfig.mapCenter.zoom);
  }, [map, tripConfig?.mapCenter]);

  const displayPlaces = useMemo<CartItem[]>(() => {
    if (!isOptimized || displayTimeline.length === 0) return placeCart;
    return displayTimeline
      .map(item => placeCart.find(p => p.id === item.id))
      .filter((p): p is CartItem => !!p);
  }, [isOptimized, displayTimeline, placeCart]);

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <Map
        id="main-map"
        mapId={MAP_ID}
        defaultCenter={DEFAULT_CENTER}
        defaultZoom={DEFAULT_ZOOM}
        disableDefaultUI
        gestureHandling="greedy"
        style={{ width: '100%', height: '100%' }}
      >
        {displayPlaces.map((place, i) => (
          <PlaceMarker key={place.id} place={place} index={i} isOptimized={isOptimized} />
        ))}
      </Map>

      {isOptimized && displayPlaces.length >= 2 && (
        <DirectionsLayer places={displayPlaces} />
      )}
    </div>
  );
}

// ── Marker ────────────────────────────────────────────────────────────────────

function PlaceMarker({ place, index, isOptimized }: {
  place: CartItem; index: number; isOptimized: boolean;
}) {
  const meta     = PRIORITY_META[place.priority];
  const dotColor = isOptimized ? ACCENT : meta.dot;
  const label    = place.name.length > 16 ? place.name.slice(0, 15) + '…' : place.name;

  return (
    <AdvancedMarker position={{ lat: place.lat, lng: place.lng }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pointerEvents: 'none' }}>
        <div style={{
          background: '#fff', borderRadius: 999, padding: '4px 9px 4px 6px',
          boxShadow: '0 2px 8px rgba(15,23,42,0.18), 0 0 0 1px rgba(15,23,42,0.06)',
          display: 'flex', alignItems: 'center', gap: 6,
          fontSize: 11, fontWeight: 600, color: '#0F172A', whiteSpace: 'nowrap',
        }}>
          <span style={{
            width: 18, height: 18, borderRadius: 999, background: dotColor,
            color: '#fff', fontSize: 10, fontWeight: 700,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            {isOptimized ? index + 1 : ''}
          </span>
          {label}
        </div>
        <div style={{ width: 2, height: 10, background: '#fff', boxShadow: '0 1px 2px rgba(15,23,42,0.2)' }} />
        <div style={{
          width: 10, height: 10, borderRadius: 999, background: dotColor,
          border: '2px solid #fff', boxShadow: '0 2px 4px rgba(15,23,42,0.25)', marginTop: -3,
        }} />
      </div>
    </AdvancedMarker>
  );
}

// ── Route layer ───────────────────────────────────────────────────────────────
//
// Priority:
//   1. Google DirectionsRenderer  → actual road path + traffic
//   2. OSRM public API            → actual road path, free, no key needed
//   3. Straight-line polyline     → last resort visual
//
// `placesKey` (string) as dep prevents re-render loops caused by array refs.

function DirectionsLayer({ places }: { places: CartItem[] }) {
  const map       = useMap('main-map');
  const routesLib = useMapsLibrary('routes');
  const placesKey = places.map(p => p.id).join(',');

  useEffect(() => {
    if (!map || places.length < 2) return;

    let cancelled = false;
    const cleanups: Array<() => void> = [];

    const addCleanup = (fn: () => void) => cleanups.push(fn);

    // ── Draw a polyline from a given path ─────────────────────────────────
    const drawPolyline = (
      path: google.maps.LatLngLiteral[],
      weight = 5,
      opacity = 0.85,
    ) => {
      if (cancelled) return;
      const poly = new google.maps.Polyline({
        path,
        map,
        strokeColor:   ACCENT,
        strokeWeight:  weight,
        strokeOpacity: opacity,
        geodesic:      true,
        zIndex:        10,
        icons: [{
          icon: {
            path:         google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
            scale:        3,
            fillColor:    ACCENT,
            fillOpacity:  1,
            strokeColor:  '#fff',
            strokeWeight: 1,
          },
          offset: '100%',
          repeat: '90px',
        }],
      });
      addCleanup(() => poly.setMap(null));
    };

    // ── Straight-line fallback ─────────────────────────────────────────────
    const drawStraightFallback = () =>
      drawPolyline(places.map(p => ({ lat: p.lat, lng: p.lng })), 4, 0.6);

    // ── Main async routing logic ───────────────────────────────────────────
    (async () => {
      // ── Step 1: Google Directions API ──────────────────────────────────
      if (routesLib) {
        const googleOk = await new Promise<boolean>(resolve => {
          const renderer = new routesLib.DirectionsRenderer({
            map,
            suppressMarkers:  true,
            preserveViewport: true,
            polylineOptions: { strokeColor: ACCENT, strokeWeight: 5, strokeOpacity: 0.85, zIndex: 10 },
          });

          // Timeout: if no response in 6 s, move on
          const timer = setTimeout(() => {
            renderer.setMap(null);
            resolve(false);
          }, 6000);

          new routesLib.DirectionsService().route(
            {
              origin:      { lat: places[0].lat, lng: places[0].lng },
              destination: { lat: places[places.length - 1].lat, lng: places[places.length - 1].lng },
              waypoints: places.slice(1, -1).map(p => ({
                location: { lat: p.lat, lng: p.lng },
                stopover: true,
              })),
              travelMode:        google.maps.TravelMode.DRIVING,
              optimizeWaypoints: false,
              unitSystem:        google.maps.UnitSystem.METRIC,
            },
            (result, status) => {
              clearTimeout(timer);
              if (cancelled) { renderer.setMap(null); resolve(false); return; }
              if (status === 'OK' && result) {
                renderer.setDirections(result);
                addCleanup(() => renderer.setMap(null));
                resolve(true);
              } else {
                renderer.setMap(null);
                console.info('[Directions] Google status:', status, '→ trying OSRM');
                resolve(false);
              }
            },
          );
        });

        if (cancelled || googleOk) return;
      }

      // ── Step 2: OSRM open-source routing (free, no API key) ────────────
      const osrmPath = await fetchOSRMRoute(places);
      if (cancelled) return;

      if (osrmPath) {
        drawPolyline(osrmPath);
      } else {
        // ── Step 3: straight-line last resort ──────────────────────────
        drawStraightFallback();
      }
    })();

    return () => {
      cancelled = true;
      cleanups.forEach(f => f());
    };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, routesLib, placesKey]);

  return null;
}

// ── OSRM routing helper ───────────────────────────────────────────────────────
// Uses the public OSRM demo server — road-following, free, global coverage.

async function fetchOSRMRoute(
  places: CartItem[],
): Promise<google.maps.LatLngLiteral[] | null> {
  // OSRM expects longitude,latitude order
  const coords = places
    .map(p => `${p.lng.toFixed(6)},${p.lat.toFixed(6)}`)
    .join(';');

  try {
    const res = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${coords}` +
      `?overview=full&geometries=geojson`,
      { signal: AbortSignal.timeout(8000) },
    );
    if (!res.ok) return null;

    const json = await res.json();
    if (json.code !== 'Ok' || !json.routes?.[0]?.geometry?.coordinates) return null;

    // GeoJSON coordinates are [lng, lat] — convert to Google Maps format
    return (json.routes[0].geometry.coordinates as [number, number][])
      .map(([lng, lat]) => ({ lat, lng }));
  } catch {
    console.info('[Directions] OSRM unavailable → straight-line fallback');
    return null;
  }
}
