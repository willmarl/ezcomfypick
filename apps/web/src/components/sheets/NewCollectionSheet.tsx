import { useState, useRef, useEffect } from 'react';

interface NewCollectionSheetProps {
  visible: boolean;
  onClose: () => void;
  onCreate: (name: string, emoji: string) => void;
}

const IconClose = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const RECOMMENDED_EMOJIS = [
  '🎨', '🎭', '📷', '🖼️', '🌈', '✨',
  '🎪', '🎬', '🎮', '🎯', '🎲', '🎸',
  '🚀', '🌟', '💎', '🔥', '❄️', '⚡',
  '🌸', '🌺', '🌻', '🍁', '🌊', '🏔️',
  '🦋', '🐉', '🦄', '🐺', '🦅', '🐠',
  '💻', '⚙️', '🔮', '📚', '🎓', '🧬',
];

export const NewCollectionSheet: React.FC<NewCollectionSheetProps> = ({ visible, onClose, onCreate }) => {
  const [name, setName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('📁');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (visible && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
    if (!visible) {
      setName('');
      setSelectedEmoji('📁');
      setShowEmojiPicker(false);
    }
  }, [visible]);

  const handleCreate = () => {
    if (!name.trim()) return;
    onCreate(name.trim(), selectedEmoji);
    setName('');
    setSelectedEmoji('📁');
  };

  const handleSelectEmoji = (emoji: string) => {
    setSelectedEmoji(emoji);
    setShowEmojiPicker(false);
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
          background: 'rgba(0,0,0,0.7)',
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
        padding: '16px 20px 40px',
        transform: visible ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform 0.3s cubic-bezier(0.32,0.72,0,1)',
        boxShadow: '0 -8px 40px rgba(0,0,0,0.6)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: '#2e2e2e' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <span style={{ fontSize: 16, fontWeight: 600 }}>New collection</span>
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

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 12, color: '#6b6b6b', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Name</label>
            <input
              ref={inputRef}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              placeholder="e.g. Cartoony"
              style={{
                width: '100%',
                padding: '12px 14px',
                background: '#1e1e1e',
                border: '1.5px solid #2a2a2a',
                borderRadius: 10,
                color: '#f0ede8',
                fontSize: 15,
                fontFamily: "'DM Sans', sans-serif",
                outline: 'none',
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: 12, color: '#6b6b6b', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Icon</label>
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              style={{
                width: '100%',
                padding: '12px 14px',
                background: '#1e1e1e',
                border: '1.5px solid #2a2a2a',
                borderRadius: 10,
                color: '#f0ede8',
                fontSize: 18,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#3a3a3a';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#2a2a2a';
              }}
            >
              {selectedEmoji}
            </button>

            {showEmojiPicker && (
              <div style={{
                marginTop: 8,
                padding: 12,
                background: '#1e1e1e',
                borderRadius: 10,
                border: '1.5px solid #2a2a2a',
                display: 'grid',
                gridTemplateColumns: 'repeat(6, 1fr)',
                gap: 8,
              }}>
                {RECOMMENDED_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleSelectEmoji(emoji)}
                    style={{
                      background: selectedEmoji === emoji ? 'oklch(65% 0.18 145 / 0.2)' : 'transparent',
                      border: selectedEmoji === emoji ? '1.5px solid oklch(65% 0.18 145)' : '1.5px solid transparent',
                      borderRadius: 8,
                      fontSize: 24,
                      cursor: 'pointer',
                      padding: 8,
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      if (selectedEmoji !== emoji) {
                        e.currentTarget.style.background = '#242424';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedEmoji !== emoji) {
                        e.currentTarget.style.background = 'transparent';
                      }
                    }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}

            <div style={{ fontSize: 11, color: '#3a3a3a', marginTop: 8 }}>
              Or paste a custom emoji above
            </div>
          </div>
        </div>

        <button
          onClick={handleCreate}
          disabled={!name.trim()}
          style={{
            width: '100%',
            padding: '14px',
            background: name.trim() ? 'oklch(65% 0.18 145)' : '#1e1e1e',
            border: 'none',
            borderRadius: 12,
            color: name.trim() ? '#0a0a0a' : '#3a3a3a',
            fontSize: 15,
            fontWeight: 600,
            cursor: name.trim() ? 'pointer' : 'default',
            transition: 'all 0.2s',
            fontFamily: "'DM Sans', sans-serif",
            marginTop: 4,
          }}
        >
          Create collection
        </button>
      </div>
    </div>
  );
};
