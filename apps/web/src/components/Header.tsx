import React from 'react';
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
  const [isMobile, setIsMobile] = React.useState(window.innerWidth < 768);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: isMobile ? '12px 12px' : '16px 20px',
      flexShrink: 0,
      zIndex: 20,
      borderBottom: '1px solid #1a1a1a',
      position: 'relative',
      gap: isMobile ? '12px' : '24px',
      minHeight: '56px',
    }}>
      {/* Logo + count */}
      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 6 : 8, minWidth: 0 }}>
        {!isMobile && (
          <span style={{
            fontSize: 17,
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: '#f0ede8',
            whiteSpace: 'nowrap',
          }}>
            comfypick
          </span>
        )}
        {count > 0 && (
          <span style={{
            fontSize: isMobile ? 10 : 11,
            fontWeight: 600,
            background: '#1e1e1e',
            border: '1px solid #2a2a2a',
            borderRadius: 20,
            padding: isMobile ? '1px 6px' : '2px 8px',
            color: '#6b6b6b',
            letterSpacing: '0.03em',
            flexShrink: 0,
          }}>
            {count}
          </span>
        )}
      </div>

      {/* Nav tabs - hidden on very small screens */}
      {!isMobile && (
        <div style={{
          display: 'flex',
          gap: '24px',
          flex: 1,
          justifyContent: 'center',
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
      )}

      {/* Mobile nav buttons */}
      {isMobile && (
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={() => navigate('/')}
            style={{
              background: 'none',
              border: 'none',
              padding: '4px 8px',
              fontSize: '12px',
              fontWeight: 500,
              color: isSwipe ? '#f0ede8' : '#6b6b6b',
              cursor: 'pointer',
              borderBottom: isSwipe ? '2px solid oklch(65% 0.18 145)' : '2px solid transparent',
              transition: 'all 0.2s',
              fontFamily: 'inherit',
            }}
          >
            Swipe
          </button>
          <button
            onClick={() => navigate('/gallery')}
            style={{
              background: 'none',
              border: 'none',
              padding: '4px 8px',
              fontSize: '12px',
              fontWeight: 500,
              color: isGallery ? '#f0ede8' : '#6b6b6b',
              cursor: 'pointer',
              borderBottom: isGallery ? '2px solid oklch(65% 0.18 145)' : '2px solid transparent',
              transition: 'all 0.2s',
              fontFamily: 'inherit',
            }}
          >
            Gallery
          </button>
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: isMobile ? 6 : 8, flexShrink: 0 }}>
        <button
          onClick={onUndo}
          disabled={!canUndo}
          style={{
            padding: isMobile ? '6px 8px' : '6px 12px',
            borderRadius: 8,
            background: '#141414',
            border: '1.5px solid #2a2a2a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: isMobile ? 4 : 6,
            cursor: canUndo ? 'pointer' : 'default',
            color: canUndo ? '#a0a0a0' : '#2a2a2a',
            transition: 'all 0.15s',
            fontSize: isMobile ? 12 : 13,
            fontWeight: 500,
            fontFamily: 'inherit',
            minHeight: '32px',
            minWidth: isMobile ? '32px' : 'auto',
          }}
        >
          <RotateCcw size={isMobile ? 14 : 16} />
          {!isMobile && 'Undo'}
        </button>
        <button
          onClick={onSettings}
          style={{
            width: isMobile ? 32 : 40,
            height: isMobile ? 32 : 40,
            borderRadius: 8,
            background: '#141414',
            border: '1.5px solid #2a2a2a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#a0a0a0',
            flexShrink: 0,
          }}
        >
          <Settings size={isMobile ? 16 : 18} />
        </button>
      </div>
    </div>
  );
};
