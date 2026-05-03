import { Plus } from 'lucide-react';
import type { Collection } from '../types';

interface PillBarProps {
  collections: Collection[];
  selected: string;
  onSelect: (folder: string) => void;
  onNew: () => void;
}

export const PillBar: React.FC<PillBarProps> = ({ collections, selected, onSelect, onNew }) => (
  <div style={{
    flexShrink: 0,
    zIndex: 20,
    paddingBottom: 28,
    background: 'linear-gradient(to top, #090909 60%, transparent)',
  }}>
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 18px 8px',
    }}>
      <span style={{
        fontSize: 11,
        color: '#3a3a3a',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        fontWeight: 600,
      }}>Save to</span>
      <button
        onClick={onNew}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          background: 'none',
          border: 'none',
          color: '#4a4a4a',
          cursor: 'pointer',
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          padding: 0,
        }}
      >
        <Plus size={16} />
        <span>New</span>
      </button>
    </div>

    <div style={{
      display: 'flex',
      gap: 8,
      overflowX: 'auto',
      overflowY: 'hidden',
      padding: '2px 18px 2px',
      scrollbarWidth: 'none',
      WebkitOverflowScrolling: 'touch',
      touchAction: 'pan-x',
    }}>
      {collections.map((col) => {
        const isActive = col.folder === selected;
        return (
          <button
            key={col.folder}
            onClick={() => onSelect(col.folder)}
            style={{
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 14px',
              borderRadius: 100,
              border: isActive ? '1.5px solid oklch(65% 0.18 145 / 0.6)' : '1.5px solid #242424',
              background: isActive ? 'oklch(65% 0.18 145 / 0.12)' : '#141414',
              color: isActive ? 'oklch(72% 0.16 145)' : '#6b6b6b',
              fontSize: 13,
              fontWeight: isActive ? 600 : 400,
              fontFamily: "'DM Sans', sans-serif",
              cursor: 'pointer',
              transition: 'all 0.15s',
              whiteSpace: 'nowrap',
            }}
          >
            <span style={{ fontSize: 14, lineHeight: 1 }}>{col.emoji || '📁'}</span>
            <span>{col.name}</span>
          </button>
        );
      })}
    </div>
  </div>
);
