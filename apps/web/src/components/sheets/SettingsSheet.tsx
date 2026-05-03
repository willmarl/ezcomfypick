import { useState, useEffect } from 'react';
import type { AppSettings } from '../../types';

interface SettingsSheetProps {
  visible: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSave: (settings: AppSettings) => void;
}

const IconClose = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

export const SettingsSheet: React.FC<SettingsSheetProps> = ({ visible, onClose, settings, onSave }) => {
  const [local, setLocal] = useState(settings);

  useEffect(() => {
    setLocal(settings);
  }, [settings, visible]);

  const handleSave = () => {
    onSave(local);
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 60,
      display: 'flex',
      alignItems: 'flex-end',
      pointerEvents: visible ? 'all' : 'none',
    }}>
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(4px)',
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.25s',
        }}
      />
      <div style={{
        position: 'relative',
        width: '100%',
        background: '#141414',
        borderRadius: '20px 20px 0 0',
        padding: '16px 20px 44px',
        transform: visible ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform 0.3s cubic-bezier(0.32,0.72,0,1)',
        boxShadow: '0 -8px 40px rgba(0,0,0,0.6)',
        maxHeight: '85vh',
        overflowY: 'auto',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: '#2e2e2e' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <span style={{ fontSize: 16, fontWeight: 600 }}>Settings</span>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#6b6b6b',
              cursor: 'pointer',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <IconClose />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <label style={{ fontSize: 12, color: '#6b6b6b', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>API Base URL</label>
            <input
              value={local.apiUrl}
              onChange={(e) => setLocal((p) => ({ ...p, apiUrl: e.target.value }))}
              placeholder="http://192.168.1.100:8000"
              style={{
                width: '100%',
                padding: '12px 14px',
                background: '#1e1e1e',
                border: '1.5px solid #2a2a2a',
                borderRadius: 10,
                color: '#f0ede8',
                fontSize: 14,
                fontFamily: 'monospace',
                outline: 'none',
              }}
            />
            <div style={{ fontSize: 11, color: '#3a3a3a', marginTop: 6 }}>Leave empty to use current host</div>
          </div>

          <div style={{ height: 1, background: '#1e1e1e' }} />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 14, color: '#f0ede8' }}>Haptic feedback</div>
              <div style={{ fontSize: 12, color: '#6b6b6b', marginTop: 2 }}>Vibrate on swipe decision</div>
            </div>
            <button
              onClick={() => setLocal((p) => ({ ...p, haptic: !p.haptic }))}
              style={{
                width: 44,
                height: 26,
                borderRadius: 13,
                background: local.haptic ? 'oklch(65% 0.18 145)' : '#2a2a2a',
                border: 'none',
                cursor: 'pointer',
                position: 'relative',
                transition: 'background 0.2s',
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 3,
                  left: local.haptic ? 'calc(100% - 23px)' : '3px',
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  background: 'white',
                  transition: 'left 0.2s',
                }}
              />
            </button>
          </div>
        </div>

        <button
          onClick={handleSave}
          style={{
            marginTop: 24,
            width: '100%',
            padding: '14px',
            background: 'oklch(65% 0.18 145)',
            border: 'none',
            borderRadius: 12,
            color: '#0a0a0a',
            fontSize: 15,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          Save settings
        </button>
      </div>
    </div>
  );
};
