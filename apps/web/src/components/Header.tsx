interface HeaderProps {
  count: number;
  canUndo: boolean;
  onUndo: () => void;
  onSettings: () => void;
}

const IconUndo = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path d="M3 9.5A6 6 0 1 0 4.5 5.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    <path d="M3 3v3.5h3.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconSettings = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <circle cx="9" cy="9" r="2.3" stroke="currentColor" strokeWidth="1.7" />
    <path d="M9 1.5v2M9 14.5v2M1.5 9h2M14.5 9h2M3.55 3.55l1.41 1.41M13.04 13.04l1.41 1.41M3.55 14.45l1.41-1.41M13.04 4.96l1.41-1.41" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  </svg>
);

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
        <IconUndo />
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
        <IconSettings />
      </button>
    </div>
  </div>
);
