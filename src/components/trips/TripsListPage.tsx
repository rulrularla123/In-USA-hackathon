'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useTravelContext } from '@/context/TravelContext';
import { ACCENT } from '@/types/travel';
import { btnReset } from '@/lib/styles';
import { listTrips, deleteTrip } from '@/lib/api';
import type { TripRecord } from '@/lib/api';

interface Props {
  onNewTrip: () => void;
}

function countryEmoji(country: string): string {
  const map: Record<string, string> = {
    japan: '🇯🇵', 'south korea': '🇰🇷', korea: '🇰🇷',
    'united states': '🇺🇸', usa: '🇺🇸', france: '🇫🇷',
    'united kingdom': '🇬🇧', uk: '🇬🇧', germany: '🇩🇪',
    italy: '🇮🇹', spain: '🇪🇸', china: '🇨🇳',
    thailand: '🇹🇭', singapore: '🇸🇬', australia: '🇦🇺',
    canada: '🇨🇦', taiwan: '🇹🇼', vietnam: '🇻🇳',
    portugal: '🇵🇹', netherlands: '🇳🇱',
  };
  return map[country.toLowerCase().trim()] ?? '🌍';
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

export default function TripsListPage({ onNewTrip }: Props) {
  const { loadTrip, tripId: activeTripId, activeTab } = useTravelContext();
  const [trips, setTrips] = useState<TripRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Re-fetch trips every time the Trips tab becomes visible
  useEffect(() => {
    if (activeTab !== 'trips') return;
    setLoading(true);
    listTrips()
      .then(setTrips)
      .catch(() => setTrips([]))
      .finally(() => setLoading(false));
  }, [activeTab]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm('Delete this trip? This cannot be undone.')) return;
    try {
      await deleteTrip(id);
      setTrips(prev => prev.filter(t => t.id !== id));
      toast.success('Trip deleted');
    } catch {
      toast.error('Failed to delete trip');
    }
  };

  return (
    <div style={{
      position: 'absolute', inset: 0, background: '#F8FAFC',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ padding: '64px 20px 20px', flexShrink: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: ACCENT, letterSpacing: 1, textTransform: 'uppercase' }}>
          Travel Planner
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 4 }}>
          <div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#0F172A', letterSpacing: -0.6, lineHeight: 1.2 }}>
              My Trips
            </div>
            {!loading && (
              <div style={{ fontSize: 13, color: '#64748B', marginTop: 3 }}>
                {trips.length === 0 ? 'No trips yet' : `${trips.length} trip${trips.length !== 1 ? 's' : ''}`}
              </div>
            )}
          </div>
          <button
            onClick={onNewTrip}
            style={{
              ...btnReset, height: 44, paddingLeft: 16, paddingRight: 16,
              borderRadius: 14, background: ACCENT, color: '#fff',
              fontSize: 14, fontWeight: 700,
              display: 'flex', alignItems: 'center', gap: 8,
              boxShadow: `0 4px 14px ${ACCENT}50`,
            }}
          >
            <span style={{ fontSize: 20, lineHeight: 1 }}>+</span> New Trip
          </button>
        </div>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 88px' }}>
        {loading ? (
          <LoadingSkeleton />
        ) : trips.length === 0 ? (
          <EmptyState onNewTrip={onNewTrip} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {trips.map(trip => (
              <TripCard
                key={trip.id}
                trip={trip}
                isActive={trip.id === activeTripId}
                onClick={() => loadTrip(trip.id)}
                onDelete={e => handleDelete(e, trip.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Trip card ─────────────────────────────────────────────────────────────────

function TripCard({ trip, isActive, onClick, onDelete }: {
  trip: TripRecord; isActive: boolean;
  onClick: () => void; onDelete: (e: React.MouseEvent) => void;
}) {
  const [pressed, setPressed] = useState(false);

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={onClick}
        onMouseDown={() => setPressed(true)}
        onMouseUp={() => setPressed(false)}
        onMouseLeave={() => setPressed(false)}
        style={{
          ...btnReset, width: '100%', textAlign: 'left',
          background: '#fff', borderRadius: 18, padding: '16px 18px',
          border: `1.5px solid ${isActive ? ACCENT : '#E2E8F0'}`,
          boxShadow: pressed ? '0 1px 4px rgba(15,23,42,0.06)' : '0 2px 8px rgba(15,23,42,0.06)',
          transform: pressed ? 'scale(0.985)' : 'scale(1)',
          transition: 'transform 120ms ease, box-shadow 120ms ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14, flexShrink: 0,
            background: `${ACCENT}0e`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28,
          }}>
            {countryEmoji(trip.country_of_stay)}
          </div>
          <div style={{ flex: 1, minWidth: 0, paddingRight: 36 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', letterSpacing: -0.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 8 }}>
              {trip.trip_name}
              {isActive && (
                <span style={{ fontSize: 10, fontWeight: 700, color: ACCENT, background: `${ACCENT}15`, padding: '2px 7px', borderRadius: 999 }}>
                  Active
                </span>
              )}
            </div>
            <div style={{ fontSize: 13, color: '#64748B', marginTop: 3, display: 'flex', gap: 8, alignItems: 'center' }}>
              <span>{trip.country_of_stay}</span>
              <span style={{ color: '#CBD5E1' }}>·</span>
              <span>{trip.total_days} {trip.total_days === 1 ? 'day' : 'days'}</span>
            </div>
            <div style={{ fontSize: 11.5, color: '#94A3B8', marginTop: 4 }}>
              {formatDate(trip.created_at)}
            </div>
          </div>
          <svg width="8" height="14" viewBox="0 0 8 14" fill="none" style={{ flexShrink: 0 }}>
            <path d="M1 1l6 6-6 6" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </button>

      {/* Delete button */}
      <button
        onClick={onDelete}
        title="Delete trip"
        style={{
          ...btnReset, position: 'absolute', top: 14, right: 14,
          width: 28, height: 28, borderRadius: 8, background: '#FEF2F2',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
          <path d="M10 11v6M14 11v6" />
          <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
        </svg>
      </button>
    </div>
  );
}

function EmptyState({ onNewTrip }: { onNewTrip: () => void }) {
  return (
    <div style={{ marginTop: 60, textAlign: 'center', padding: '0 20px' }}>
      <div style={{ width: 80, height: 80, borderRadius: 999, margin: '0 auto', background: `${ACCENT}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>
        ✈️
      </div>
      <div style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', marginTop: 18, letterSpacing: -0.2 }}>
        No trips yet
      </div>
      <div style={{ fontSize: 14, color: '#64748B', marginTop: 6, lineHeight: 1.55, maxWidth: 280, margin: '8px auto 0' }}>
        Create your first trip to start planning an optimized route.
      </div>
      <button
        onClick={onNewTrip}
        style={{ ...btnReset, marginTop: 24, height: 48, padding: '0 24px', borderRadius: 14, background: ACCENT, color: '#fff', fontSize: 15, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 8, boxShadow: `0 6px 16px ${ACCENT}40` }}
      >
        + Create First Trip
      </button>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {[1, 2, 3].map(i => (
        <div key={i} style={{ background: '#fff', borderRadius: 18, padding: '16px 18px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: '#F1F5F9', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ height: 16, background: '#F1F5F9', borderRadius: 8, width: '60%', marginBottom: 8 }} />
            <div style={{ height: 12, background: '#F8FAFC', borderRadius: 6, width: '40%' }} />
          </div>
        </div>
      ))}
    </div>
  );
}
