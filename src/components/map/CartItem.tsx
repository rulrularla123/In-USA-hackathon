'use client';

import { Trash } from '@/components/icons';
import { btnReset } from '@/lib/styles';
import DurationStepper from './DurationStepper';
import PrioritySelect from './PrioritySelect';
import { useTravelContext } from '@/context/TravelContext';
import type { CartItem as CartItemType } from '@/types/travel';

interface Props {
  place: CartItemType;
}

// Convert "HH:MM" to minutes from midnight, and back
function toMins(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

export default function CartItem({ place }: Props) {
  const { removePlace, updatePlaceSettings } = useTravelContext();

  const handleMealTimeChange = (field: 'mealStartTime' | 'mealEndTime', val: string) => {
    const start = field === 'mealStartTime' ? val : (place.mealStartTime ?? '12:00');
    const end   = field === 'mealEndTime'   ? val : (place.mealEndTime   ?? '13:00');
    const duration = Math.max(15, toMins(end) - toMins(start));
    updatePlaceSettings(place.id, {
      [field]: val,
      stayDuration: duration,
    });
  };

  // When priority switches to Meal and times aren't set yet, supply defaults
  const mealStart = place.mealStartTime ?? '12:00';
  const mealEnd   = place.mealEndTime   ?? '13:00';

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 14,
        padding: 12,
        border: '1px solid #E2E8F0',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      {/* Name + remove */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14.5, fontWeight: 700, color: '#0F172A', letterSpacing: -0.1 }}>
            {place.name}
          </div>
          <div style={{ fontSize: 12, color: '#64748B', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {place.address}
          </div>
        </div>
        <button
          onClick={() => removePlace(place.id)}
          style={{ ...btnReset, width: 32, height: 32, borderRadius: 8, background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
        >
          <Trash size={15} color="#94A3B8" />
        </button>
      </div>

      {/* Duration / Meal time + Priority */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        {place.priority === 'Meal' ? (
          /* Meal: show absolute time range */
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#FEF2F2', padding: '4px 10px', borderRadius: 12, border: '1px solid #FECACA' }}>
            <span style={{ fontSize: 10.5, fontWeight: 700, color: '#B91C1C', textTransform: 'uppercase', letterSpacing: 0.4 }}>🍽️</span>
            <input
              type="time"
              value={mealStart}
              onChange={e => handleMealTimeChange('mealStartTime', e.target.value)}
              style={{
                border: 'none', background: 'transparent', fontSize: 13,
                fontWeight: 700, color: '#B91C1C', fontFamily: 'inherit',
                outline: 'none', width: 76,
              }}
            />
            <span style={{ fontSize: 12, color: '#B91C1C', fontWeight: 600 }}>~</span>
            <input
              type="time"
              value={mealEnd}
              onChange={e => handleMealTimeChange('mealEndTime', e.target.value)}
              style={{
                border: 'none', background: 'transparent', fontSize: 13,
                fontWeight: 700, color: '#B91C1C', fontFamily: 'inherit',
                outline: 'none', width: 76,
              }}
            />
          </div>
        ) : (
          /* Normal / Favorite: stay duration stepper */
          <DurationStepper
            value={place.stayDuration}
            onChange={v => updatePlaceSettings(place.id, { stayDuration: v })}
          />
        )}
        <div style={{ flex: 1 }} />
        <PrioritySelect
          value={place.priority}
          onChange={v => {
            // When switching TO Meal, seed default times if not already set
            if (v === 'Meal' && !place.mealStartTime) {
              updatePlaceSettings(place.id, { priority: v, mealStartTime: '12:00', mealEndTime: '13:00', stayDuration: 60 });
            } else {
              updatePlaceSettings(place.id, { priority: v });
            }
          }}
        />
      </div>
    </div>
  );
}
