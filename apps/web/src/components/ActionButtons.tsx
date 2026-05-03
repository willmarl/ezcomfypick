import { X, Check, ZoomIn } from 'lucide-react';

interface ActionButtonsProps {
  onLeft: () => void;
  onRight: () => void;
  disabled: boolean;
  isMagnified: boolean;
  onToggleMagnify: () => void;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({ onLeft, onRight, disabled, isMagnified, onToggleMagnify }) => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    padding: '12px 20px',
    flexShrink: 0,
    zIndex: 20,
  }}>
    {/* X and Check buttons row */}
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '24px',
    }}>
    <button
      onClick={onLeft}
      disabled={disabled}
      style={{
        width: 60,
        height: 60,
        borderRadius: '50%',
        background: '#141414',
        border: '2px solid oklch(62% 0.2 25 / 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: disabled ? 'default' : 'pointer',
        color: 'oklch(62% 0.2 25)',
        boxShadow: '0 0 20px oklch(62% 0.2 25 / 0.1)',
        transition: 'transform 0.1s',
        opacity: disabled ? 0.5 : 1,
      }}
      onPointerDown={(e) => {
        if (!disabled) (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.92)';
      }}
      onPointerUp={(e) => {
        (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
      }}
    >
      <X size={28} strokeWidth={2.8} />
    </button>

    <button
      onClick={onRight}
      disabled={disabled}
      style={{
        width: 60,
        height: 60,
        borderRadius: '50%',
        background: '#141414',
        border: '2px solid oklch(65% 0.18 145 / 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: disabled ? 'default' : 'pointer',
        color: 'oklch(65% 0.18 145)',
        boxShadow: '0 0 20px oklch(65% 0.18 145 / 0.1)',
        transition: 'transform 0.1s',
        opacity: disabled ? 0.5 : 1,
      }}
      onPointerDown={(e) => {
        if (!disabled) (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.92)';
      }}
      onPointerUp={(e) => {
        (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
      }}
    >
      <Check size={28} strokeWidth={2.8} />
    </button>
    </div>

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
