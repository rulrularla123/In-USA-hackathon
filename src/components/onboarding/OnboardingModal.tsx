'use client';

import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { useTravelContext } from '@/context/TravelContext';
import { ACCENT } from '@/types/travel';
import { getCountryCenter } from '@/lib/countryCenters';
import { btnReset } from '@/lib/styles';
import { X } from '@/components/icons';

const POPULAR_COUNTRIES = [
  'Japan', 'South Korea', 'United States', 'France', 'United Kingdom',
  'Thailand', 'Singapore', 'Italy', 'Germany', 'Australia', 'Taiwan', 'Vietnam',
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function OnboardingModal({ open, onClose }: Props) {
  const { setTripConfig } = useTravelContext();

  const [tripName, setTripName] = useState('');
  const [countryOfStay, setCountryOfStay] = useState('');
  const [tripDays, setTripDays] = useState(3);

  const canSubmit = tripName.trim().length > 0 && countryOfStay.trim().length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setTripConfig({
      tripName: tripName.trim(),
      countryOfStay: countryOfStay.trim(),
      tripDays,
      mapCenter: getCountryCenter(countryOfStay.trim()),
    });
    // reset form for next time
    setTripName('');
    setCountryOfStay('');
    setTripDays(3);
    onClose();
  };

  return (
    <Dialog.Root open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(15,23,42,0.6)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            zIndex: 200,
            animation: 'overlayShow 200ms ease',
          }}
        />
        <Dialog.Content
          style={{
            position: 'fixed', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            background: '#fff', borderRadius: 24,
            padding: '36px 28px 28px',
            width: 'min(460px, calc(100vw - 32px))',
            maxHeight: 'calc(100dvh - 32px)',
            overflowY: 'auto', zIndex: 201,
            boxShadow: '0 32px 80px rgba(15,23,42,0.22), 0 0 0 1px rgba(15,23,42,0.06)',
            animation: 'contentShow 250ms cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {/* Close button */}
          <Dialog.Close
            onClick={onClose}
            style={{
              ...btnReset,
              position: 'absolute', top: 20, right: 20,
              width: 32, height: 32, borderRadius: 999,
              background: '#F1F5F9',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <X size={16} color="#64748B" />
          </Dialog.Close>

          {/* Header */}
          <div style={{ marginBottom: 28 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: `${ACCENT}12`, color: ACCENT,
              fontSize: 11, fontWeight: 700, letterSpacing: 1,
              textTransform: 'uppercase', padding: '4px 10px',
              borderRadius: 999, marginBottom: 12,
            }}>
              ✈ New Trip
            </div>
            <Dialog.Title style={{ fontSize: 28, fontWeight: 800, color: '#0F172A', letterSpacing: -0.6, margin: 0, lineHeight: 1.2 }}>
              Plan Your Trip
            </Dialog.Title>
            <Dialog.Description style={{ fontSize: 14, color: '#64748B', marginTop: 8, lineHeight: 1.55 }}>
              Set up your trip details. This helps us geofence your search and build your day-by-day itinerary.
            </Dialog.Description>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <Field label="Trip Name" hint='e.g. "My Tokyo Adventure"'>
              <input
                type="text" value={tripName}
                onChange={e => setTripName(e.target.value)}
                placeholder="My Summer Escape" required autoFocus
                style={inputStyle(!!tripName)}
              />
            </Field>

            <Field label="Country of Stay" hint="Places outside this country will be blocked">
              <input
                type="text" value={countryOfStay}
                onChange={e => setCountryOfStay(e.target.value)}
                placeholder="e.g. Japan" required list="country-suggestions"
                style={inputStyle(!!countryOfStay)}
              />
              <datalist id="country-suggestions">
                {POPULAR_COUNTRIES.map(c => <option key={c} value={c} />)}
              </datalist>
              {countryOfStay && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, fontSize: 12, color: '#10B981', fontWeight: 600 }}>
                  <span>✓</span> Geofencing active for {countryOfStay}
                </div>
              )}
            </Field>

            <Field label="Trip Duration">
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 4 }}>
                <input
                  type="range" min={1} max={33} value={tripDays}
                  onChange={e => setTripDays(Number(e.target.value))}
                  style={{ flex: 1, accentColor: ACCENT, height: 4 }}
                />
                <div style={{
                  minWidth: 62, height: 38, borderRadius: 10,
                  background: `${ACCENT}12`, color: ACCENT,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 15, fontWeight: 700,
                }}>
                  {tripDays} {tripDays === 1 ? 'day' : 'days'}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                {Array.from({ length: Math.min(tripDays, 10) }, (_, i) => (
                  <div key={i} style={{
                    padding: '4px 12px', borderRadius: 999,
                    background: i === 0 ? '#0F172A' : '#F1F5F9',
                    color: i === 0 ? '#fff' : '#64748B',
                    fontSize: 11.5, fontWeight: 600,
                  }}>Day {i + 1}</div>
                ))}
                {tripDays > 10 && (
                  <div style={{ padding: '4px 10px', borderRadius: 999, background: '#F1F5F9', color: '#94A3B8', fontSize: 11.5, fontWeight: 600 }}>
                    +{tripDays - 10} more
                  </div>
                )}
              </div>
            </Field>

            <button
              type="submit" disabled={!canSubmit}
              style={{
                ...btnReset, marginTop: 4, height: 54, borderRadius: 14,
                background: canSubmit ? ACCENT : '#CBD5E1',
                color: '#fff', fontSize: 16, fontWeight: 700, letterSpacing: -0.1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                cursor: canSubmit ? 'pointer' : 'not-allowed',
                boxShadow: canSubmit ? `0 6px 20px ${ACCENT}45` : 'none',
                transition: 'background 150ms, box-shadow 150ms',
              }}
            >
              Start Planning →
            </button>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{label}</span>
        {hint && <span style={{ fontSize: 11, color: '#94A3B8' }}>{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function inputStyle(hasValue: boolean): React.CSSProperties {
  return {
    width: '100%', boxSizing: 'border-box', height: 46, padding: '0 14px',
    borderRadius: 12, border: `1.5px solid ${hasValue ? '#E2E8F0' : '#E2E8F0'}`,
    fontSize: 15, color: '#0F172A', fontFamily: 'inherit',
    outline: 'none', background: '#F8FAFC', transition: 'border-color 150ms',
  };
}
