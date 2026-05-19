'use client';

import { useTravelContext } from '@/context/TravelContext';
import { ACCENT } from '@/types/travel';
import { fmtTime } from '@/lib/routeOptimizer';
import DayChips from './DayChips';
import TimelineList from './TimelineList';
import OverScheduleWarning from './OverScheduleWarning';

export default function PlanView() {
  const { isOptimized, displayTimeline, tripConfig } = useTravelContext();

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: '#F8FAFC',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{ padding: '64px 20px 0', flexShrink: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: ACCENT, letterSpacing: 1, textTransform: 'uppercase' }}>
          Itinerary
        </div>
        <div style={{ fontSize: 26, fontWeight: 800, color: '#0F172A', letterSpacing: -0.6, marginTop: 2 }}>
          {tripConfig?.tripName ?? 'My Trip'}
        </div>

        {/* Summary stats */}
        {isOptimized && displayTimeline.length > 0 && (
          <div style={{ display: 'flex', gap: 14, marginTop: 8, fontSize: 12, color: '#64748B' }}>
            <span>
              <b style={{ color: '#0F172A' }}>{displayTimeline.length}</b> stops
            </span>
            <span>
              <b style={{ color: '#0F172A' }}>{fmtTime(displayTimeline[0].arrival)}</b>
              {' – '}
              <b style={{ color: '#0F172A' }}>{fmtTime(displayTimeline[displayTimeline.length - 1].depart)}</b>
            </span>
          </div>
        )}

        <DayChips />

        {/* Over-schedule warning appears under the day chips */}
        <OverScheduleWarning />
      </div>

      {/* Scrollable timeline */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 20px 88px' }}>
        <TimelineList />
      </div>
    </div>
  );
}
