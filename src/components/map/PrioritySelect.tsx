'use client';

import { useState } from 'react';
import { Chevron } from '@/components/icons';
import { btnReset } from '@/lib/styles';
import { PRIORITY_META } from '@/types/travel';
import type { Priority } from '@/types/travel';

interface Props {
  value: Priority;
  onChange: (v: Priority) => void;
}

export default function PrioritySelect({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const meta = PRIORITY_META[value];

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        style={{
          ...btnReset,
          height: 30,
          padding: '0 10px',
          borderRadius: 8,
          background: meta.bg,
          color: meta.fg,
          fontSize: 12,
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <span style={{ width: 6, height: 6, borderRadius: 999, background: meta.dot, display: 'block' }} />
        {meta.label}
        <Chevron size={12} color={meta.fg} />
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 36,
            zIndex: 5,
            background: '#fff',
            borderRadius: 10,
            padding: 4,
            minWidth: 130,
            boxShadow: '0 8px 24px rgba(15,23,42,0.18), 0 0 0 1px rgba(15,23,42,0.06)',
          }}
        >
          {(Object.entries(PRIORITY_META) as [Priority, typeof PRIORITY_META[Priority]][]).map(([k, m]) => (
            <button
              key={k}
              onMouseDown={() => { onChange(k); setOpen(false); }}
              style={{
                ...btnReset,
                width: '100%',
                textAlign: 'left',
                padding: '7px 9px',
                borderRadius: 6,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 13,
                color: '#0F172A',
                background: value === k ? '#F8FAFC' : 'transparent',
              }}
            >
              <span style={{ width: 8, height: 8, borderRadius: 999, background: m.dot, display: 'block' }} />
              {m.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
