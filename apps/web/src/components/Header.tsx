import { RotateCcw, Settings } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

interface HeaderProps {
  count: number;
  canUndo: boolean;
  onUndo: () => void;
  onSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({ count, canUndo, onUndo, onSettings }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isGallery = location.pathname === '/gallery';
  const isSwipe = location.pathname === '/';

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px 20px',
      gap: '24px',
      flexShrink: 0,
      zIndex: 20,
      borderBottom: '1px solid #1a1a1a',
      position: 'relative',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, position: 'absolute', left: '20px' }}>
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

      {/* Nav tabs */}
      <div style={{
        display: 'flex',
        gap: '24px',
      }}>
        <button
          onClick={() => navigate('/')}
          style={{
            background: 'none',
            border: 'none',
            padding: '0',
            fontSize: '14px',
            fontWeight: 500,
            color: isSwipe ? '#f0ede8' : '#6b6b6b',
            cursor: 'pointer',
            borderBottom: isSwipe ? '2px solid oklch(65% 0.18 145)' : '2px solid transparent',
            transition: 'all 0.2s',
            fontFamily: 'inherit',
            paddingBottom: '4px',
          }}
        >
          Swipe
        </button>
        <button
          onClick={() => navigate('/gallery')}
          style={{
            background: 'none',
            border: 'none',
            padding: '0',
            fontSize: '14px',
            fontWeight: 500,
            color: isGallery ? '#f0ede8' : '#6b6b6b',
            cursor: 'pointer',
            borderBottom: isGallery ? '2px solid oklch(65% 0.18 145)' : '2px solid transparent',
            transition: 'all 0.2s',
            fontFamily: 'inherit',
            paddingBottom: '4px',
          }}
        >
          Gallery
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8, position: 'absolute', right: '20px' }}>
        <button
          onClick={onUndo}
          disabled={!canUndo}
          style={{
            padding: '6px 12px',
            borderRadius: 12,
            background: '#141414',
            border: '1.5px solid #2a2a2a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            cursor: canUndo ? 'pointer' : 'default',
            color: canUndo ? '#a0a0a0' : '#2a2a2a',
            transition: 'all 0.15s',
            fontSize: 13,
            fontWeight: 500,
            fontFamily: 'inherit',
          }}
        >
          <RotateCcw size={16} />
          Undo
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
};
