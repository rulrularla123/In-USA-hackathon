'use client';

import { useRef, useState } from 'react';
import { Minus, Plus } from '@/components/icons';
import { btnReset } from '@/lib/styles';
import { fmtDuration } from '@/lib/routeOptimizer';

const STEP = 15;
const MIN = 15;
const MAX = 720;
const clamp = (n: number) => Math.max(MIN, Math.min(MAX, n));

interface Props {
  value: number;
  onChange: (v: number) => void;
}

export default function DurationStepper({ value, onChange }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const beginEdit = () => {
    const h = Math.floor(value / 60);
    const m = value % 60;
    setDraft(`${h}:${String(m).padStart(2, '0')}`);
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  };

  const commitEdit = () => {
    const s = draft.trim().toLowerCase();
    let mins = NaN;
    if (/^\d+:\d{1,2}$/.test(s)) {
      const [h, m] = s.split(':').map(Number);
      mins = h * 60 + m;
    } else if (/^(\d+(\.\d+)?)\s*h(\s*\d+\s*m)?$/.test(s)) {
      const hMatch = s.match(/(\d+(\.\d+)?)\s*h/);
      const mMatch = s.match(/(\d+)\s*m/);
      mins = (hMatch ? parseFloat(hMatch[1]) * 60 : 0) + (mMatch ? parseInt(mMatch[1], 10) : 0);
    } else if (/^\d+\s*m?$/.test(s)) {
      mins = parseInt(s, 10);
    }
    if (!isNaN(mins) && mins > 0) onChange(clamp(Math.round(mins)));
    setEditing(false);
  };

  const stepBtn: React.CSSProperties = {
    ...btnReset,
    width: 28,
    height: 28,
    borderRadius: 8,
    background: '#fff',
    border: '1px solid #E2E8F0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#475569',
  };

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: 4,
        borderRadius: 12,
        background: '#F1F5F9',
      }}
    >
      <div
        style={{
          fontSize: 10.5,
          fontWeight: 700,
          color: '#64748B',
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          paddingLeft: 6,
          paddingRight: 2,
        }}
      >
        Stay
      </div>

      <button style={stepBtn} onClick={() => onChange(clamp(value - STEP))} aria-label="Decrease">
        <Minus size={14} />
      </button>

      {editing ? (
        <input
          ref={inputRef}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={e => {
            if (e.key === 'Enter') { e.preventDefault(); commitEdit(); }
            if (e.key === 'Escape') setEditing(false);
          }}
          style={{
            width: 64,
            height: 28,
            textAlign: 'center',
            borderRadius: 8,
            border: '1px solid #2563EB',
            background: '#fff',
            fontSize: 13,
            fontWeight: 700,
            color: '#0F172A',
            fontFamily: 'inherit',
            outline: 'none',
            fontVariantNumeric: 'tabular-nums',
          }}
          placeholder="1:30"
        />
      ) : (
        <button
          onClick={beginEdit}
          style={{
            ...btnReset,
            width: 64,
            height: 28,
            borderRadius: 8,
            background: '#fff',
            border: '1px solid #E2E8F0',
            fontSize: 13,
            fontWeight: 700,
            color: '#0F172A',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {fmtDuration(value)}
        </button>
      )}

      <button style={stepBtn} onClick={() => onChange(clamp(value + STEP))} aria-label="Increase">
        <Plus size={14} />
      </button>
    </div>
  );
}
