'use client';

import { Chevron, ChevUp, Pin, Sparkle, Warn } from '@/components/icons';
import { btnReset } from '@/lib/styles';
import { useTravelContext } from '@/context/TravelContext';
import { ACCENT } from '@/types/travel';
import ActiveHours from './ActiveHours';
import CartItem from './CartItem';

const NAV_HEIGHT = 72;
const PEEK_HEIGHT = 120;
const FULL_HEIGHT = 520;

export default function PlaceCartDrawer() {
  const { placeCart, activeHours, sheetOpen, setSheetOpen, optimizeRoute, isOptimizing, selectedDay } = useTravelContext();

  const valid = !!(activeHours.startTime && activeHours.endTime);
  const canOptimize = valid && placeCart.length >= 2;

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: NAV_HEIGHT,
        height: sheetOpen ? FULL_HEIGHT : PEEK_HEIGHT,
        transition: 'height 320ms cubic-bezier(0.32, 0.72, 0, 1)',
        background: '#fff',
        borderTopLeftRadius: 22,
        borderTopRightRadius: 22,
        boxShadow: '0 -8px 32px rgba(15,23,42,0.16)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 40,
      }}
    >
      {/* Drag handle */}
      <button
        onClick={() => setSheetOpen(!sheetOpen)}
        style={{
          ...btnReset,
          width: '100%',
          padding: '10px 0 6px',
          display: 'flex',
          justifyContent: 'center',
        }}
        aria-label={sheetOpen ? 'Collapse drawer' : 'Expand drawer'}
      >
        <div style={{ width: 40, height: 5, borderRadius: 999, background: '#CBD5E1' }} />
      </button>

      {/* Sticky header */}
      <div
        style={{
          padding: '6px 18px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#0F172A', letterSpacing: -0.2 }}>
            Day {selectedDay} · Route
          </div>
          <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
            {placeCart.length === 0
              ? 'No places yet — search above to add'
              : `${placeCart.length} ${placeCart.length === 1 ? 'place' : 'places'} in cart`}
          </div>
        </div>
        <button
          onClick={() => setSheetOpen(!sheetOpen)}
          style={{
            ...btnReset,
            padding: '6px 10px',
            borderRadius: 999,
            background: '#F1F5F9',
            fontSize: 12,
            fontWeight: 600,
            color: '#475569',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          {sheetOpen ? 'Collapse' : 'Expand'}
          {sheetOpen ? <Chevron size={14} color="#475569" /> : <ChevUp size={14} color="#475569" />}
        </button>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 18px 18px' }}>
        <ActiveHours />
        <CartList />
      </div>

      {/* Sticky CTA */}
      <div
        style={{
          padding: '12px 18px 16px',
          borderTop: '1px solid #F1F5F9',
          background: '#fff',
        }}
      >
        {!canOptimize && (
          <div style={{ fontSize: 11, color: '#94A3B8', textAlign: 'center', marginBottom: 6 }}>
            {!valid
              ? 'Set active hours to continue'
              : placeCart.length < 2
              ? 'Add at least 2 places to optimize'
              : ''}
          </div>
        )}
        <button
          disabled={!canOptimize || isOptimizing}
          onClick={optimizeRoute}
          style={{
            ...btnReset,
            width: '100%',
            height: 52,
            borderRadius: 14,
            background: canOptimize && !isOptimizing ? ACCENT : '#CBD5E1',
            color: '#fff',
            fontSize: 16,
            fontWeight: 700,
            letterSpacing: -0.1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            boxShadow: canOptimize && !isOptimizing ? `0 6px 16px ${ACCENT}55, 0 0 0 1px ${ACCENT}` : 'none',
            cursor: canOptimize && !isOptimizing ? 'pointer' : 'not-allowed',
            transition: 'transform 120ms ease',
          }}
        >
          {isOptimizing ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⟳</span>
              Asking Claude…
            </span>
          ) : (
            <>
              <Sparkle size={18} color="#fff" />
              Find Optimal Route
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function CartList() {
  const { placeCart } = useTravelContext();

  if (placeCart.length === 0) {
    return (
      <div
        style={{
          padding: '28px 16px',
          textAlign: 'center',
          borderRadius: 16,
          background: '#F8FAFC',
          border: '1px dashed #CBD5E1',
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 999,
            background: '#fff',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 0 1px #E2E8F0',
            marginBottom: 8,
          }}
        >
          <Pin size={20} color="#94A3B8" />
        </div>
        <div style={{ fontSize: 13, color: '#64748B', maxWidth: 240, margin: '0 auto' }}>
          Search above to add places to your route.
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: '#0F172A',
          textTransform: 'uppercase',
          letterSpacing: 0.4,
          marginTop: 2,
        }}
      >
        Place Cart
      </div>
      {placeCart.map(p => (
        <CartItem key={p.id} place={p} />
      ))}
    </div>
  );
}
