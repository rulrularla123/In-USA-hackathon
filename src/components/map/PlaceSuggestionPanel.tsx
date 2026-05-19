'use client';

import { useState, useEffect } from 'react';
import { useTravelContext } from '@/context/TravelContext';
import { ACCENT } from '@/types/travel';
import { btnReset } from '@/lib/styles';
import { Plus, X } from '@/components/icons';
import { getSuggestions, getGeminiKey, type PlaceSuggestion } from '@/lib/gemini';

interface Props {
  onClose: () => void;
}

export default function PlaceSuggestionPanel({ onClose }: Props) {
  const { displayTimeline, tripConfig, addPlace } = useTravelContext();

  const [loading, setLoading]         = useState(false);
  const [retrying, setRetrying]       = useState(false);
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [error, setError]             = useState('');
  const [added, setAdded]             = useState<Set<string>>(new Set());

  const apiKey = getGeminiKey();

  // Auto-fetch on open
  useEffect(() => {
    if (apiKey) {
      fetchSuggestions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchSuggestions = async () => {
    setLoading(true);
    setRetrying(false);
    setError('');
    setSuggestions([]);
    try {
      const results = await getSuggestions(
        displayTimeline.map(t => ({
          name: t.name, address: t.address,
          lat: t.lat, lng: t.lng, stayDuration: t.stayDuration,
        })),
        tripConfig?.countryOfStay ?? '',
        apiKey,
      );
      setSuggestions(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get suggestions');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = (s: PlaceSuggestion) => {
    addPlace({ id: s.id, name: s.name, address: s.address, lat: s.lat, lng: s.lng });
    setAdded(prev => new Set(prev).add(s.id));
  };

  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, bottom: 72,
      background: '#fff',
      borderTopLeftRadius: 22, borderTopRightRadius: 22,
      boxShadow: '0 -8px 32px rgba(15,23,42,0.16)',
      zIndex: 45, maxHeight: '70dvh',
      display: 'flex', flexDirection: 'column',
      animation: 'slideUp 280ms cubic-bezier(0.16,1,0.3,1)',
    }}>
      {/* Header */}
      <div style={{ padding: '10px 18px 12px', borderBottom: '1px solid #F1F5F9', flexShrink: 0 }}>
        <div style={{ width: 40, height: 5, borderRadius: 999, background: '#CBD5E1', margin: '0 auto 12px' }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18 }}>✨</span>
              <span style={{ fontSize: 17, fontWeight: 700, color: '#0F172A', letterSpacing: -0.2 }}>
                AI Place Suggestions
              </span>
            </div>
            <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
              Powered by Gemini 2.0 Flash Lite
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ ...btnReset, width: 32, height: 32, borderRadius: 999, background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <X size={16} color="#64748B" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px 24px' }}>

        {/* No API key configured */}
        {!apiKey && (
          <div style={{ padding: '20px 0', textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🔑</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', marginBottom: 6 }}>
              Gemini API Key not configured
            </div>
            <div style={{ fontSize: 13, color: '#64748B', lineHeight: 1.5, maxWidth: 260, margin: '0 auto' }}>
              Add <code style={{ background: '#F1F5F9', padding: '2px 6px', borderRadius: 4, fontSize: 12 }}>NEXT_PUBLIC_GEMINI_API_KEY</code> to your <code style={{ background: '#F1F5F9', padding: '2px 6px', borderRadius: 4, fontSize: 12 }}>.env.local</code> and restart the dev server.
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '32px 0', color: '#64748B' }}>
            <div style={{ fontSize: 28, marginBottom: 12, animation: 'spin 1.5s linear infinite', display: 'inline-block' }}>✨</div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>
              {retrying ? 'Rate limit hit — retrying…' : 'Asking Gemini for ideas…'}
            </div>
            <div style={{ fontSize: 12, marginTop: 4 }}>
              {retrying ? 'Waiting a moment before retry' : 'Analysing your route'}
            </div>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div style={{ padding: 14, borderRadius: 12, background: '#FEF2F2', border: '1px solid #FECACA', marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#B91C1C', marginBottom: 4 }}>Error</div>
            <div style={{ fontSize: 12.5, color: '#7F1D1D', lineHeight: 1.45 }}>{error}</div>
            <button
              onClick={fetchSuggestions}
              style={{ ...btnReset, marginTop: 10, fontSize: 12, fontWeight: 700, color: ACCENT }}
            >
              Try again →
            </button>
          </div>
        )}

        {/* Suggestion cards */}
        {!loading && suggestions.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>
              {suggestions.length} places recommended
            </div>
            {suggestions.map(s => (
              <SuggestionCard
                key={s.id}
                suggestion={s}
                isAdded={added.has(s.id)}
                onAdd={() => handleAdd(s)}
              />
            ))}
            <button
              onClick={fetchSuggestions}
              style={{ ...btnReset, fontSize: 12, fontWeight: 600, color: '#7C3AED', marginTop: 4, textAlign: 'center', width: '100%' }}
            >
              ↻ Get different suggestions
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Card ──────────────────────────────────────────────────────────────────────

function SuggestionCard({ suggestion: s, isAdded, onAdd }: {
  suggestion: PlaceSuggestion; isAdded: boolean; onAdd: () => void;
}) {
  const stayLabel = s.estimatedStayMinutes < 60
    ? `${s.estimatedStayMinutes}m`
    : `${Math.floor(s.estimatedStayMinutes / 60)}h${s.estimatedStayMinutes % 60 > 0 ? ` ${s.estimatedStayMinutes % 60}m` : ''}`;

  return (
    <div style={{
      borderRadius: 14, padding: 14,
      border: `1px solid ${isAdded ? '#BBF7D0' : '#E2E8F0'}`,
      background: isAdded ? '#F0FDF4' : '#fff',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', letterSpacing: -0.2 }}>
            {s.name}
          </div>
          <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {s.address}
          </div>
        </div>
        <button
          onClick={onAdd}
          disabled={isAdded}
          style={{
            ...btnReset, flexShrink: 0,
            width: 32, height: 32, borderRadius: 999,
            background: isAdded ? '#86EFAC' : `${ACCENT}15`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {isAdded ? <span style={{ fontSize: 14 }}>✓</span> : <Plus size={16} color={ACCENT} />}
        </button>
      </div>

      <div style={{ fontSize: 12.5, color: '#475569', marginTop: 8, lineHeight: 1.5 }}>
        {s.description}
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: '#7C3AED', background: '#F5F3FF', padding: '3px 8px', borderRadius: 999 }}>
          📍 {s.betweenStop}
        </span>
        <span style={{ fontSize: 11, fontWeight: 600, color: '#0369A1', background: '#F0F9FF', padding: '3px 8px', borderRadius: 999 }}>
          ⏱ ~{stayLabel}
        </span>
      </div>
    </div>
  );
}
