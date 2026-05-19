'use client';

import { useState } from 'react';
import { Clock, Nav, Chevron, NoteIcon, Minus, Plus } from '@/components/icons';
import { btnReset } from '@/lib/styles';
import { PRIORITY_META, ACCENT } from '@/types/travel';
import { fmtTime, fmtDuration, mealLabel } from '@/lib/routeOptimizer';
import { useTravelContext } from '@/context/TravelContext';
import type { TimelineItem } from '@/types/travel';

interface Props {
  item: TimelineItem;
  index: number;
  isFirst: boolean;
}

// Convert "HH:MM" ↔ minutes-from-midnight
function timeStrToMins(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}
function minsToTimeStr(mins: number): string {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

const STEP = 15;

export default function TimelineNode({ item, index, isFirst }: Props) {
  const { notes, setNote, updateTimelineItem } = useTravelContext();
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);

  // Local draft state for the edit form
  const [draftArrival, setDraftArrival] = useState('');
  const [draftStay, setDraftStay] = useState(0);

  const meta = PRIORITY_META[item.priority];
  const note = notes[item.id] ?? '';

  const openEdit = () => {
    setDraftArrival(minsToTimeStr(item.arrival));
    setDraftStay(item.stayDuration);
    setEditing(true);
  };

  const saveEdit = () => {
    const newArrival = timeStrToMins(draftArrival);
    updateTimelineItem(item.id, { arrival: newArrival, stayDuration: draftStay });
    setEditing(false);
  };

  const clampStay = (n: number) => Math.max(15, Math.min(720, n));

  return (
    <div style={{ display: 'flex', gap: 14, marginBottom: 14, position: 'relative' }}>
      {/* Step number */}
      <div style={{ width: 40, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 8 }}>
        <div
          style={{
            width: 36, height: 36, borderRadius: 999,
            background: item.isManualOverride ? '#7C3AED' : ACCENT,
            color: '#fff', fontWeight: 700, fontSize: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 0 0 4px #F8FAFC, 0 4px 10px ${item.isManualOverride ? '#7C3AED' : ACCENT}55`,
            zIndex: 2,
          }}
        >
          {index + 1}
        </div>
      </div>

      {/* Card */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Transit chip — driving time for Normal/Favorite, meal window for Meal */}
        {!isFirst && item.priority !== 'Meal' && (
          <div
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              background: '#fff', color: '#475569',
              fontSize: 11.5, fontWeight: 600,
              padding: '4px 10px', borderRadius: 999,
              border: '1px solid #E2E8F0', marginBottom: 6,
            }}
          >
            <Nav size={11} color="#475569" />
            {item.travel}m drive
          </div>
        )}
        {/* Meal window chip — shows meal type + stay window */}
        {item.priority === 'Meal' && (
          <div
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              background: '#FEF2F2', color: '#B91C1C',
              fontSize: 11.5, fontWeight: 700,
              padding: '4px 10px', borderRadius: 999,
              border: '1px solid #FECACA', marginBottom: 6,
            }}
          >
            🍽️ {mealLabel(item.arrival)} · {fmtTime(item.arrival)} – {fmtTime(item.depart)}
          </div>
        )}

        <div
          style={{
            background: '#fff', borderRadius: 16, padding: 14,
            border: `1px solid ${item.isManualOverride ? '#DDD6FE' : '#E2E8F0'}`,
            boxShadow: '0 1px 3px rgba(15,23,42,0.04)',
          }}
        >
          {/* ── View mode ───────────────────────────────────────────────── */}
          {!editing ? (
            <>
              {/* Time row */}
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 8 }}>
                <div
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    background: `${item.isManualOverride ? '#7C3AED' : ACCENT}10`,
                    color: item.isManualOverride ? '#7C3AED' : ACCENT,
                    padding: '4px 9px', borderRadius: 8,
                    fontSize: 12, fontWeight: 700, fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  <Clock size={12} color={item.isManualOverride ? '#7C3AED' : ACCENT} />
                  {fmtTime(item.arrival)} – {fmtTime(item.depart)}
                </div>
                <div style={{ fontSize: 11.5, color: '#64748B', fontWeight: 600 }}>
                  · {fmtDuration(item.stayDuration)} stay
                </div>
                {item.isManualOverride && (
                  <span
                    style={{
                      fontSize: 10, fontWeight: 700, color: '#7C3AED',
                      background: '#EDE9FE', padding: '2px 7px', borderRadius: 999,
                    }}
                  >
                    Adjusted
                  </span>
                )}
              </div>

              {/* Name + badge */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', letterSpacing: -0.2, lineHeight: 1.25 }}>
                    {item.name}
                  </div>
                  <div style={{ fontSize: 12.5, color: '#64748B', marginTop: 2 }}>{item.address}</div>
                </div>
                <span
                  style={{
                    flexShrink: 0, padding: '3px 8px', borderRadius: 6,
                    background: meta.bg, color: meta.fg,
                    fontSize: 11, fontWeight: 700,
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                  }}
                >
                  <span style={{ width: 5, height: 5, borderRadius: 999, background: meta.dot, display: 'block' }} />
                  {meta.label}
                </span>
              </div>

              {/* Action row */}
              <div style={{ display: 'flex', gap: 12, marginTop: 12, alignItems: 'center' }}>
                {/* Notes toggle */}
                <button
                  onClick={() => setExpanded(e => !e)}
                  style={{ ...btnReset, display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 600, color: '#64748B' }}
                >
                  <NoteIcon size={13} color="#64748B" />
                  {note ? 'Edit notes' : 'Add notes'}
                  <span style={{ transition: 'transform 220ms', transform: expanded ? 'rotate(180deg)' : 'none', display: 'flex' }}>
                    <Chevron size={14} color="#64748B" />
                  </span>
                </button>
                <div style={{ flex: 1 }} />
                {/* Adjust button */}
                <button
                  onClick={openEdit}
                  style={{
                    ...btnReset,
                    fontSize: 11.5, fontWeight: 700,
                    color: '#7C3AED',
                    background: '#F5F3FF',
                    padding: '4px 10px', borderRadius: 8,
                  }}
                >
                  Adjust
                </button>
              </div>

              {/* Notes textarea */}
              {expanded && (
                <div style={{ marginTop: 10 }}>
                  <textarea
                    value={note}
                    onChange={e => setNote(item.id, e.target.value)}
                    placeholder="Add notes, confirmation numbers, or menus here…"
                    rows={3}
                    style={{
                      width: '100%', boxSizing: 'border-box',
                      padding: '10px 12px', borderRadius: 10, resize: 'vertical',
                      border: '1px solid #E2E8F0', background: '#F8FAFC',
                      fontFamily: 'inherit', fontSize: 13, color: '#0F172A',
                      outline: 'none', minHeight: 70,
                    }}
                  />
                </div>
              )}
            </>
          ) : (
            /* ── Edit mode ──────────────────────────────────────────────── */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>
                Adjust: {item.name}
              </div>

              {/* Arrival time */}
              <label style={{ display: 'block' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#64748B', marginBottom: 4 }}>
                  Arrival time
                </div>
                <input
                  type="time"
                  value={draftArrival}
                  onChange={e => setDraftArrival(e.target.value)}
                  style={{
                    width: '100%', boxSizing: 'border-box', height: 42,
                    padding: '0 12px', borderRadius: 10,
                    border: '1.5px solid #7C3AED', background: '#F8FAFC',
                    fontSize: 15, fontWeight: 600, color: '#0F172A',
                    fontFamily: 'inherit', outline: 'none',
                  }}
                />
              </label>

              {/* Stay duration */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#64748B', marginBottom: 6 }}>
                  Stay duration
                </div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#F1F5F9', padding: 4, borderRadius: 12 }}>
                  <button
                    style={{ ...btnReset, width: 28, height: 28, borderRadius: 8, background: '#fff', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    onClick={() => setDraftStay(clampStay(draftStay - STEP))}
                  >
                    <Minus size={14} />
                  </button>
                  <span style={{ width: 64, textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#0F172A' }}>
                    {fmtDuration(draftStay)}
                  </span>
                  <button
                    style={{ ...btnReset, width: 28, height: 28, borderRadius: 8, background: '#fff', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    onClick={() => setDraftStay(clampStay(draftStay + STEP))}
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>
                  New departure: {fmtTime(timeStrToMins(draftArrival) + draftStay)}
                </div>
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => setEditing(false)}
                  style={{
                    ...btnReset, flex: 1, height: 38, borderRadius: 10,
                    background: '#F1F5F9', color: '#475569',
                    fontSize: 13, fontWeight: 600,
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={saveEdit}
                  style={{
                    ...btnReset, flex: 2, height: 38, borderRadius: 10,
                    background: '#7C3AED', color: '#fff',
                    fontSize: 13, fontWeight: 700,
                  }}
                >
                  Save Changes
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
