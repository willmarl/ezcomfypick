import { RotateCcw, Settings } from 'lucide-react';

interface HeaderProps {
  count: number;
  canUndo: boolean;
  onUndo: () => void;
  onSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({ count, canUndo, onUndo, onSettings }) => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px 8px',
    flexShrink: 0,
    zIndex: 20,
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.02em', color: '#f0ede8' }}>comfypick</span>
      {count > 0 && (
        <span style={{
          fontSize: 11,
          fontWeight: 600,
          background: '#1e1e1e',
          border: '1px solid #2a2a2a',
          borderRadius: 20,
          padding: '2px 8px',
          color: '#6b6b6b',
          letterSpacing: '0.03em',
        }}>
          {count}
        </span>
      )}
    </div>
    <div style={{ display: 'flex', gap: 8 }}>
      <button
        onClick={onUndo}
        disabled={!canUndo}
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          background: '#141414',
          border: '1.5px solid #2a2a2a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: canUndo ? 'pointer' : 'default',
          color: canUndo ? '#a0a0a0' : '#2a2a2a',
          transition: 'all 0.15s',
        }}
      >
        <RotateCcw size={18} />
      </button>
      <button
        onClick={onSettings}
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          background: '#141414',
          border: '1.5px solid #2a2a2a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: '#a0a0a0',
        }}
      >
        <Settings size={18} />
      </button>
    </div>
  </div>
);
