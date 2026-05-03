import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import type { AppSettings } from './types';
import { SwipePage } from './pages/SwipePage';
import { GalleryPage } from './pages/GalleryPage';

const SETTINGS_STORAGE_KEY = 'ezcomfypick_settings';

const getStoredSettings = (): AppSettings => {
  try {
    const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : { haptic: true };
  } catch {
    return { haptic: true };
  }
};

const saveSettings = (settings: AppSettings) => {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    console.warn('Failed to save settings');
  }
};

export default function App() {
  const [settings, setSettings] = useState<AppSettings>(getStoredSettings);
  const [backendReady, setBackendReady] = useState<boolean | null>(null);

  // Check backend connectivity on mount
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const response = await fetch('/api/hello', { method: 'GET' });
        setBackendReady(response.ok);
      } catch {
        setBackendReady(false);
      }
    };

    checkBackend();
    const interval = setInterval(checkBackend, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  if (backendReady === false) {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#090909',
          color: '#f0ede8',
          gap: 24,
          padding: 20,
        }}
      >
        <div style={{ fontSize: 64 }}>⚠️</div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>Backend Unreachable</div>
          <div style={{ fontSize: 14, color: '#6b6b6b', marginBottom: 24 }}>
            The server may be starting up. Please wait...
          </div>
        </div>
        <button
          onClick={() => setBackendReady(null)}
          style={{
            padding: '12px 24px',
            background: 'oklch(65% 0.18 145)',
            border: 'none',
            borderRadius: 8,
            color: '#0a0a0a',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
            fontFamily: "'DM Sans', sans-serif",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '0.9';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '1';
          }}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<SwipePage settings={settings} onSettingsSave={handleSaveSettings} />} />
      <Route path="/gallery" element={<GalleryPage />} />
    </Routes>
  );
}
