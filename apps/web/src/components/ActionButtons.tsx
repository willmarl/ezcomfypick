import { ZoomIn } from 'lucide-react';

interface ActionButtonsProps {
  isMagnified: boolean;
  onToggleMagnify: () => void;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({ isMagnified, onToggleMagnify }) => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    padding: '12px 20px',
    flexShrink: 0,
    zIndex: 20,
  }}>

    {/* Magnify toggle button */}
    <button
      onClick={onToggleMagnify}
      style={{
        width: 44,
        height: 44,
        borderRadius: '50%',
        background: isMagnified ? 'oklch(75% 0.15 260 / 0.15)' : '#141414',
        border: `1.5px solid ${isMagnified ? 'oklch(75% 0.15 260)' : '#2a2a2a'}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        color: isMagnified ? 'oklch(75% 0.15 260)' : '#6b6b6b',
        transition: 'all 0.2s',
      }}
    >
      <ZoomIn size={20} />
    </button>
  </div>
);
