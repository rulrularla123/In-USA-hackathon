'use client';

import { useEffect, useRef, useState } from 'react';
import { useMapsLibrary, useMap } from '@vis.gl/react-google-maps';
import { toast } from 'sonner';
import { Search, X } from '@/components/icons';
import { btnReset } from '@/lib/styles';
import { useTravelContext } from '@/context/TravelContext';
import { isSameCountry } from '@/lib/countryCenters';

export default function SearchBar() {
  const { addPlace, tripConfig } = useTravelContext();
  const placesLib = useMapsLibrary('places');
  const map = useMap('main-map');

  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    if (!placesLib || !inputRef.current) return;

    const ac = new placesLib.Autocomplete(inputRef.current, {
      // address_components needed for country geofencing validation
      fields: ['place_id', 'name', 'formatted_address', 'geometry', 'address_components'],
    });
    autocompleteRef.current = ac;

    const listener = ac.addListener('place_changed', () => {
      const place = ac.getPlace();
      if (!place.geometry?.location || !place.place_id || !place.name) return;

      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();

      // ── Country geofence validation ──────────────────────────────────────
      if (tripConfig) {
        const countryComp = place.address_components?.find(c =>
          c.types.includes('country'),
        );
        const placeCountryLong = countryComp?.long_name ?? '';
        const placeCountryCode = countryComp?.short_name ?? '';

        if (placeCountryLong && !isSameCountry(placeCountryLong, placeCountryCode, tripConfig.countryOfStay)) {
          toast.warning('Place outside your trip country', {
            description: `"${place.name}" is in ${placeCountryLong}, but your trip is set to ${tripConfig.countryOfStay}.`,
            duration: 4000,
          });
          // Pan to show the rejected location so the user understands why
          map?.panTo({ lat, lng });
          map?.setZoom(14);
          setInputValue('');
          if (inputRef.current) inputRef.current.value = '';
          return;
        }
      }

      // ── Add to cart ──────────────────────────────────────────────────────
      addPlace({
        id: place.place_id,
        name: place.name,
        address: place.formatted_address ?? '',
        lat,
        lng,
      });

      // ── Bug fix: pan + zoom to the newly added marker ────────────────────
      map?.panTo({ lat, lng });
      map?.setZoom(15);

      setInputValue('');
      if (inputRef.current) inputRef.current.value = '';
    });

    return () => {
      google.maps.event.removeListener(listener);
      google.maps.event.clearInstanceListeners(ac);
      autocompleteRef.current = null;
    };
  }, [placesLib, addPlace, map, tripConfig]);

  return (
    <div style={{ position: 'absolute', top: 60, left: 14, right: 14, zIndex: 30 }}>
      <div
        style={{
          background: '#fff',
          borderRadius: 14,
          padding: '11px 14px',
          boxShadow: '0 4px 16px rgba(15,23,42,0.12), 0 0 0 1px rgba(15,23,42,0.05)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <Search size={18} color="#64748B" />
        <input
          ref={inputRef}
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          placeholder={
            tripConfig
              ? `Search places in ${tripConfig.countryOfStay}…`
              : 'Search places, cafes, landmarks…'
          }
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            fontSize: 15,
            fontFamily: 'inherit',
            background: 'transparent',
            color: '#0F172A',
          }}
        />
        {inputValue && (
          <button
            onClick={() => {
              setInputValue('');
              if (inputRef.current) inputRef.current.value = '';
            }}
            style={btnReset}
          >
            <X size={16} color="#94A3B8" />
          </button>
        )}
      </div>
    </div>
  );
}
