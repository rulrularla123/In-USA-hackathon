'use client';

import { useTravelContext } from '@/context/TravelContext';
import { ACCENT } from '@/types/travel';
import TimelineNode from './TimelineNode';
import EmptyState from './EmptyState';

export default function TimelineList() {
  const { displayTimeline, isOptimized, selectedDay } = useTravelContext();

  const showTimeline = isOptimized && displayTimeline.length > 0;

  if (!showTimeline) return <EmptyState />;

  return (
    <div style={{ position: 'relative', paddingTop: 12 }}>
      {/* Vertical connector line */}
      <div
        style={{
          position: 'absolute',
          left: 19,
          top: 22,
          bottom: 22,
          width: 2,
          background: ACCENT,
          borderRadius: 2,
          opacity: 0.18,
        }}
      />
      {displayTimeline.map((item, i) => (
        <TimelineNode key={item.id} item={item} index={i} isFirst={i === 0} />
      ))}
    </div>
  );
}
