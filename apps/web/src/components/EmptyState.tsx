interface EmptyStateProps {
  onReload: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ onReload }) => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    gap: 16,
    padding: '0 40px',
    textAlign: 'center',
  }}>
    <div style={{ fontSize: 56, opacity: 0.15, lineHeight: 1 }}>✓</div>
    <div style={{ fontSize: 20, fontWeight: 600, color: '#f0ede8' }}>All caught up</div>
    <div style={{ fontSize: 14, color: '#6b6b6b', lineHeight: 1.6 }}>No more images to review in this queue.</div>
    <button
      onClick={onReload}
      style={{
        marginTop: 8,
        padding: '10px 24px',
        background: '#1e1e1e',
        border: '1.5px solid #2a2a2a',
        borderRadius: 24,
        color: '#a0a0a0',
        fontSize: 14,
        cursor: 'pointer',
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      Reload queue
    </button>
  </div>
);
