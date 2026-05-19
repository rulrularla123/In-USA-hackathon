'use client';

import { useState } from 'react';
import { useTravelContext } from '@/context/TravelContext';
import { Sparkle } from '@/components/icons';
import { btnReset } from '@/lib/styles';
import { ACCENT } from '@/types/travel';
import MapContainer from './MapContainer';
import SearchBar from './SearchBar';
import PlaceCartDrawer from './PlaceCartDrawer';
import PlaceSuggestionPanel from './PlaceSuggestionPanel';

export default function MapView() {
  const { isOptimized, displayTimeline, setActiveTab, selectedDay, setSelectedDay, tripConfig } =
    useTravelContext();

  const [showSuggestions, setShowSuggestions] = useState(false);

  // No trip selected — show prompt
  if (!tripConfig) {
    return (
      <div style={{ position: 'absolute', inset: 0, background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', padding: '0 32px' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🗺️</div>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#0F172A' }}>No trip selected</div>
          <div style={{ fontSize: 13.5, color: '#64748B', marginTop: 6, lineHeight: 1.5, maxWidth: 260 }}>
            Go to the Trips tab to create or load a trip.
          </div>
          <button
            onClick={() => setActiveTab('trips')}
            style={{ marginTop: 18, padding: '10px 20px', borderRadius: 12, background: ACCENT, color: '#fff', border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
          >
            Go to My Trips
          </button>
        </div>
      </div>
    );
  }

  const totalDays = tripConfig.tripDays;

  return (
    <div style={{ position: 'absolute', inset: 0, background: '#EEF2F6', overflow: 'hidden' }}>
      <MapContainer />
      <SearchBar />

      {/* Day selector chips */}
      <div style={{ position: 'absolute', top: 12, left: 14, zIndex: 35, display: 'flex', gap: 6 }}>
        {Array.from({ length: totalDays }, (_, i) => i + 1).map(d => {
          const active = d === selectedDay;
          return (
            <button
              key={d}
              onClick={() => setSelectedDay(d)}
              style={{
                ...btnReset, height: 32, padding: '0 12px', borderRadius: 999,
                background: active ? '#0F172A' : 'rgba(255,255,255,0.92)',
                color: active ? '#fff' : '#475569',
                fontSize: 12, fontWeight: 700,
                boxShadow: '0 2px 8px rgba(15,23,42,0.12)',
                backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
                border: active ? 'none' : '1px solid rgba(255,255,255,0.6)',
                transition: 'background 150ms',
              }}
            >
              Day {d}
            </button>
          );
        })}
      </div>

      {/* Optimization success banner */}
      {isOptimized && (
        <div
          style={{
            position: 'absolute', top: 120, left: 14, right: 14, zIndex: 25,
            display: 'flex', flexDirection: 'column', gap: 8,
          }}
        >
          {/* Route optimized banner */}
          <div
            style={{
              background: `${ACCENT}f2`, color: '#fff',
              borderRadius: 12, padding: '8px 12px',
              fontSize: 12.5, fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 8,
              boxShadow: `0 6px 16px ${ACCENT}55`,
            }}
          >
            <Sparkle size={14} color="#fff" />
            Day {selectedDay} optimized — {displayTimeline.length} stops
            <div style={{ flex: 1 }} />
            <button
              onClick={() => setActiveTab('plan')}
              style={{ ...btnReset, fontSize: 11, fontWeight: 700, background: 'rgba(255,255,255,0.22)', padding: '3px 8px', borderRadius: 999, color: '#fff' }}
            >
              View
            </button>
          </div>

          {/* AI Suggest button — only after optimization */}
          <button
            onClick={() => setShowSuggestions(true)}
            style={{
              ...btnReset,
              width: '100%', height: 40, borderRadius: 12,
              background: 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
              border: '1px solid rgba(124,58,237,0.25)',
              color: '#7C3AED', fontSize: 13, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: '0 2px 12px rgba(124,58,237,0.15)',
            }}
          >
            <span style={{ fontSize: 16 }}>✨</span>
            Suggest places along this route
          </button>
        </div>
      )}

      {/* AI Suggestion panel */}
      {showSuggestions && (
        <PlaceSuggestionPanel onClose={() => setShowSuggestions(false)} />
      )}

      {/* Place cart drawer — hide when suggestion panel is open */}
      {!showSuggestions && <PlaceCartDrawer />}
    </div>
  );
}
