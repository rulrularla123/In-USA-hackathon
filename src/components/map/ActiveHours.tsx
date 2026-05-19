'use client';

import { Clock, Warn } from '@/components/icons';
import { useTravelContext } from '@/context/TravelContext';

export default function ActiveHours() {
  const { activeHours, setActiveHours } = useTravelContext();
  const valid = !!(activeHours.startTime && activeHours.endTime);

  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <Clock size={15} color="#0F172A" />
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: '#0F172A',
            textTransform: 'uppercase',
            letterSpacing: 0.4,
          }}
        >
          Active Hours
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <TimeField
          label="Start"
          value={activeHours.startTime}
          onChange={v => setActiveHours(h => ({ ...h, startTime: v }))}
          placeholder="09:00"
        />
        <TimeField
          label="End"
          value={activeHours.endTime}
          onChange={v => setActiveHours(h => ({ ...h, endTime: v }))}
          placeholder="22:00"
        />
      </div>

      {!valid && (
        <div
          style={{
            marginTop: 10,
            padding: '10px 12px',
            borderRadius: 12,
            background: '#FFFBEB',
            border: '1px solid #FDE68A',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
          }}
        >
          <Warn size={16} color="#D97706" style={{ flexShrink: 0, marginTop: 1 }} />
          <div style={{ fontSize: 12.5, color: '#78350F', lineHeight: 1.4 }}>
            Please set your active hours first to calculate the timeline.
          </div>
        </div>
      )}
    </div>
  );
}

function TimeField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <label style={{ display: 'block' }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: '#64748B', marginBottom: 4 }}>{label}</div>
      <input
        type="time"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%',
          boxSizing: 'border-box',
          height: 44,
          padding: '0 12px',
          background: value ? '#F8FAFC' : '#FEF3C7',
          borderRadius: 12,
          border: value ? '1px solid #E2E8F0' : '1px solid #FDE68A',
          fontSize: 15,
          fontWeight: 600,
          color: '#0F172A',
          fontFamily: 'inherit',
          outline: 'none',
        }}
      />
    </label>
  );
}
