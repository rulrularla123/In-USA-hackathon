'use client';

import { Nav, MapIcon } from '@/components/icons';
import { btnReset } from '@/lib/styles';
import { useTravelContext } from '@/context/TravelContext';
import { ACCENT } from '@/types/travel';

export default function EmptyState() {
  const { selectedDay, setActiveTab, tripConfig } = useTravelContext();

  // No trip selected yet → prompt user to go to Trips tab
  if (!tripConfig) {
    return (
      <div style={{ marginTop: 60, textAlign: 'center', padding: '0 20px' }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>✈️</div>
        <div style={{ fontSize: 17, fontWeight: 700, color: '#0F172A', letterSpacing: -0.2 }}>
          No trip selected
        </div>
        <div style={{ fontSize: 13.5, color: '#64748B', marginTop: 6, maxWidth: 260, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.5 }}>
          Go to the Trips tab to create a new trip or load a saved one.
        </div>
        <button
          onClick={() => setActiveTab('trips')}
          style={{ ...btnReset, marginTop: 18, height: 42, padding: '0 18px', borderRadius: 999, background: ACCENT, color: '#fff', fontSize: 14, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 8, boxShadow: `0 6px 16px ${ACCENT}40` }}
        >
          Go to My Trips
        </button>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 60, textAlign: 'center', padding: '0 20px' }}>
      <div
        style={{
          width: 76,
          height: 76,
          borderRadius: 999,
          margin: '0 auto',
          background: `${ACCENT}10`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Nav size={32} color={ACCENT} />
      </div>

      <div
        style={{
          fontSize: 17,
          fontWeight: 700,
          color: '#0F172A',
          marginTop: 18,
          letterSpacing: -0.2,
        }}
      >
        {selectedDay === 1 ? 'No route optimized yet' : `Day ${selectedDay} not planned yet`}
      </div>

      <div
        style={{
          fontSize: 13.5,
          color: '#64748B',
          marginTop: 6,
          maxWidth: 280,
          marginLeft: 'auto',
          marginRight: 'auto',
          lineHeight: 1.5,
        }}
      >
        {selectedDay === 1
          ? "Add places in the Map tab and tap 'Find Optimal Route' to build your timeline."
          : "We're starting with Day 1 — add more days from the Map tab when you're ready."}
      </div>

      <button
        onClick={() => setActiveTab('map')}
        style={{
          ...btnReset,
          marginTop: 18,
          height: 42,
          padding: '0 18px',
          borderRadius: 999,
          background: ACCENT,
          color: '#fff',
          fontSize: 14,
          fontWeight: 700,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          boxShadow: `0 6px 16px ${ACCENT}40`,
        }}
      >
        <MapIcon size={16} color="#fff" /> Open Map
      </button>
    </div>
  );
}
