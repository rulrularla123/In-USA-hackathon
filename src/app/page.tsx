'use client';

import { useState } from 'react';
import { useTravelContext } from '@/context/TravelContext';
import BottomNavBar from '@/components/layout/BottomNavBar';
import MapView from '@/components/map/MapView';
import PlanView from '@/components/plan/PlanView';
import TripsListPage from '@/components/trips/TripsListPage';
import OnboardingModal from '@/components/onboarding/OnboardingModal';

export default function HomePage() {
  const { activeTab } = useTravelContext();
  const [showNewTripModal, setShowNewTripModal] = useState(false);

  return (
    <div style={{ width: '100%', height: '100dvh', position: 'relative', overflow: 'hidden', background: '#F8FAFC' }}>

      {/* Trips list */}
      <div style={{
        position: 'absolute', inset: 0,
        visibility: activeTab === 'trips' ? 'visible' : 'hidden',
        pointerEvents: activeTab === 'trips' ? 'auto' : 'none',
      }}>
        <TripsListPage onNewTrip={() => setShowNewTripModal(true)} />
      </div>

      {/* Map — kept in DOM so the Google Map never unmounts */}
      <div style={{
        position: 'absolute', inset: 0,
        visibility: activeTab === 'map' ? 'visible' : 'hidden',
        pointerEvents: activeTab === 'map' ? 'auto' : 'none',
      }}>
        <MapView />
      </div>

      {/* Plan */}
      <div style={{
        position: 'absolute', inset: 0,
        visibility: activeTab === 'plan' ? 'visible' : 'hidden',
        pointerEvents: activeTab === 'plan' ? 'auto' : 'none',
      }}>
        <PlanView />
      </div>

      <BottomNavBar />

      <OnboardingModal
        open={showNewTripModal}
        onClose={() => setShowNewTripModal(false)}
      />
    </div>
  );
}
