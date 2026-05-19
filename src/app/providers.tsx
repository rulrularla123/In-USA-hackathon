'use client';

import { APIProvider } from '@vis.gl/react-google-maps';
import { Toaster } from 'sonner';
import { TravelProvider } from '@/context/TravelContext';

interface Props {
  children: React.ReactNode;
  apiKey: string;
}

export function Providers({ children, apiKey }: Props) {
  if (!apiKey) {
    return (
      <div style={{
        height: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: 12, padding: 24, background: '#F8FAFC',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}>
        <div style={{ fontSize: 40 }}>🗺️</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#0F172A' }}>Google Maps API Key Missing</div>
        <div style={{ fontSize: 14, color: '#64748B', textAlign: 'center', maxWidth: 360 }}>
          Add <code style={{ background: '#F1F5F9', padding: '2px 6px', borderRadius: 4 }}>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to your <code style={{ background: '#F1F5F9', padding: '2px 6px', borderRadius: 4 }}>.env.local</code> file and restart the dev server.
        </div>
      </div>
    );
  }

  return (
    <APIProvider
      apiKey={apiKey}
      // 'marker' library enables AdvancedMarker without requiring a Map ID
      libraries={['places', 'routes', 'marker']}
      onError={(e) => console.error('[Google Maps] Load error:', e)}
    >
      <TravelProvider>{children}</TravelProvider>
      <Toaster
        position="top-center"
        richColors
        toastOptions={{
          style: {
            fontFamily: 'Inter, -apple-system, system-ui, sans-serif',
            fontSize: 14,
            borderRadius: 12,
          },
        }}
      />
    </APIProvider>
  );
}
