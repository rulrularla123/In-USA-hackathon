'use client';

import { Warn } from '@/components/icons';
import { useTravelContext } from '@/context/TravelContext';

function fmtOverSchedule(mins: number): string {
  if (mins <= 0) return '';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m} minute${m !== 1 ? 's' : ''}`;
  if (m === 0) return `${h} hour${h !== 1 ? 's' : ''}`;
  return `${h} hour${h !== 1 ? 's' : ''} and ${m} minute${m !== 1 ? 's' : ''}`;
}

export default function OverScheduleWarning() {
  const { overScheduleMinutes } = useTravelContext();

  if (overScheduleMinutes <= 0) return null;

  return (
    <div
      style={{
        margin: '12px 0 4px',
        padding: '12px 14px',
        borderRadius: 14,
        background: '#FFFBEB',
        border: '1.5px solid #FDE68A',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
      }}
    >
      <div style={{ flexShrink: 0, marginTop: 1 }}>
        <Warn size={16} color="#D97706" />
      </div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#92400E' }}>
          Over-scheduled by {fmtOverSchedule(overScheduleMinutes)}
        </div>
        <div style={{ fontSize: 12, color: '#78350F', marginTop: 3, lineHeight: 1.45 }}>
          Your trip runs past the end time. Use the adjust button on each stop to
          shorten stays or shift arrival times back into your window.
        </div>
      </div>
    </div>
  );
}
