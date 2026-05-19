'use client';

import { useTravelContext } from '@/context/TravelContext';
import { SuitcaseIcon, MapIcon, CalIcon } from '@/components/icons';
import { btnReset } from '@/lib/styles';
import { ACCENT } from '@/types/travel';
import type { ActiveTab } from '@/types/travel';

const NAV_ITEMS: {
  id: ActiveTab;
  label: string;
  Icon: React.ComponentType<{ size?: number; color?: string }>;
}[] = [
  { id: 'trips', label: 'Trips', Icon: SuitcaseIcon },
  { id: 'map',   label: 'Map',   Icon: MapIcon },
  { id: 'plan',  label: 'Plan',  Icon: CalIcon },
];

export default function BottomNavBar() {
  const { activeTab, setActiveTab, tripConfig } = useTravelContext();

  return (
    <div
      style={{
        position: 'fixed', left: 0, right: 0, bottom: 0,
        height: 72, boxSizing: 'border-box',
        paddingTop: 8, paddingBottom: 22,
        background: '#fff', borderTop: '1px solid #E2E8F0',
        display: 'flex', justifyContent: 'space-around', alignItems: 'center',
        zIndex: 55,
      }}
    >
      {NAV_ITEMS.map(({ id, label, Icon }) => {
        const active = id === activeTab;
        // Map and Plan are dimmed (but still tappable) when no trip is active
        const dimmed = (id === 'map' || id === 'plan') && !tripConfig;
        const color = active ? ACCENT : dimmed ? '#D1D5DB' : '#94A3B8';

        return (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            style={{
              ...btnReset, flex: 1, padding: '6px 0',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              color,
              opacity: dimmed ? 0.5 : 1,
            }}
          >
            <Icon size={22} color={color} />
            <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 0.2 }}>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
