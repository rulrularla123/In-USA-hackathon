'use client';

import { btnReset } from '@/lib/styles';
import { useTravelContext } from '@/context/TravelContext';

export default function DayChips() {
  const { selectedDay, setSelectedDay, tripConfig } = useTravelContext();

  const totalDays = tripConfig?.tripDays ?? 3;
  const days = Array.from({ length: totalDays }, (_, i) => i + 1);

  return (
    <div
      style={{
        display: 'flex',
        gap: 8,
        marginTop: 14,
        overflowX: 'auto',
        paddingBottom: 4,
      }}
    >
      {days.map(d => {
        const active = d === selectedDay;
        return (
          <button
            key={d}
            onClick={() => setSelectedDay(d)}
            style={{
              ...btnReset,
              flexShrink: 0,
              padding: '8px 16px',
              borderRadius: 999,
              background: active ? '#0F172A' : '#fff',
              color: active ? '#fff' : '#475569',
              border: active ? 'none' : '1px solid #E2E8F0',
              fontSize: 13,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            Day {d}
            {active && (
              <span
                style={{
                  fontSize: 10,
                  padding: '1px 6px',
                  borderRadius: 999,
                  background: 'rgba(255,255,255,0.18)',
                  color: '#fff',
                }}
              >
                ·
              </span>
            )}
          </button>
        );
      })}
      <div style={{ flex: 1 }} />
    </div>
  );
}
