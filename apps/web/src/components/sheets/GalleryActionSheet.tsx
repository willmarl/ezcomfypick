import { useState, useEffect, useRef } from 'react';
import { X, ArrowLeft, Download, ArrowRight, Tag, Trash2, RotateCcw } from 'lucide-react';
import { apiClient } from '../../api/client';
import type { Collection } from '../../types';

interface GalleryActionSheetProps {
  visible: boolean;
  onClose: () => void;
  imagePath: string | null;
  collections: Collection[];
  allTags: string[];
  onActionComplete: (action: 'trash' | 'readd' | 'move', newPath?: string) => void;
}

type View = 'menu' | 'move' | 'tags';

export const GalleryActionSheet: React.FC<GalleryActionSheetProps> = ({
  visible,
  onClose,
  imagePath,
  collections,
  allTags,
  onActionComplete,
}) => {
  const [view, setView] = useState<View>('menu');
  const [imageTags, setImageTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);
  const [busy, setBusy] = useState(false);
  const tagInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!visible) {
      setView('menu');
      setNewTagInput('');
      setShowTagInput(false);
      setBusy(false);
    }
  }, [visible]);

  useEffect(() => {
    if (view === 'tags' && imagePath) {
      apiClient.getGalleryImageTags(imagePath).then(setImageTags).catch(console.error);
    }
  }, [view, imagePath]);

  useEffect(() => {
    if (showTagInput) {
      setTimeout(() => tagInputRef.current?.focus(), 50);
    }
  }, [showTagInput]);

  const handleDownload = () => {
    if (!imagePath) return;
    const a = document.createElement('a');
    a.href = apiClient.getGalleryImageUrl(imagePath);
    a.download = imagePath.split('/').pop() ?? 'image';
    a.click();
    onClose();
  };

  const handleMove = async (toCollection: string) => {
    console.log('handleMove called with:', { imagePath, toCollection, busy });
    if (!imagePath || busy) return;
    setBusy(true);
    try {
      console.log('Calling galleryMove API...');
      const res = await apiClient.galleryMove(imagePath, toCollection);
      console.log('galleryMove response:', res);
      onActionComplete('move', res.new_path);
      onClose();
    } catch (err) {
      console.error('Move failed:', err);
      alert(`Failed to move image: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setBusy(false);
    }
  };

  const handleTrash = async () => {
    console.log('handleTrash called', { imagePath, busy });
    if (!imagePath || busy) return;
    setBusy(true);
    try {
      console.log('Calling galleryTrash...');
      await apiClient.galleryTrash(imagePath);
      console.log('galleryTrash success');
      onActionComplete('trash');
      onClose();
    } catch (err) {
      console.error('Trash failed:', err);
      alert(`Trash failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setBusy(false);
    }
  };

  const handleReadd = async () => {
    console.log('handleReadd called', { imagePath, busy });
    if (!imagePath || busy) return;
    setBusy(true);
    try {
      console.log('Calling galleryReadd...');
      await apiClient.galleryReadd(imagePath);
      console.log('galleryReadd success');
      onActionComplete('readd');
      onClose();
    } catch (err) {
      console.error('Re-add failed:', err);
      alert(`Re-add failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setBusy(false);
    }
  };

  const handleToggleTag = async (tag: string) => {
    if (!imagePath) return;
    if (imageTags.includes(tag)) {
      await apiClient.removeGalleryImageTag(imagePath, tag);
      setImageTags((prev) => prev.filter((t) => t !== tag));
    } else {
      await apiClient.addGalleryImageTag(imagePath, tag);
      setImageTags((prev) => [...prev, tag]);
    }
  };

  const handleAddNewTag = async () => {
    const tag = newTagInput.trim();
    if (!tag || !imagePath) return;
    await apiClient.addGalleryImageTag(imagePath, tag);
    if (!imageTags.includes(tag)) setImageTags((prev) => [...prev, tag]);
    setNewTagInput('');
    setShowTagInput(false);
  };

  const actionRow = (
    icon: React.ReactNode,
    label: string,
    onClick: () => void,
    danger = false
  ) => (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '14px 4px',
        background: 'none',
        border: 'none',
        borderBottom: '1px solid #1e1e1e',
        color: danger ? '#e05555' : '#d0cdc8',
        fontSize: 15,
        cursor: 'pointer',
        fontFamily: 'inherit',
        textAlign: 'left',
      }}
    >
      <span style={{ color: danger ? '#e05555' : '#6b6b6b', display: 'flex' }}>{icon}</span>
      {label}
    </button>
  );

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        display: 'flex',
        alignItems: 'flex-end',
        pointerEvents: visible ? 'all' : 'none',
      }}
    >
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
      <div
        style={{
          position: 'relative',
          width: '100%',
          background: '#141414',
          borderRadius: '20px 20px 0 0',
          padding: '16px 20px 40px',
          transform: visible ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.3s cubic-bezier(0.32,0.72,0,1)',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.6)',
          maxHeight: '80vh',
          overflowY: 'auto',
        }}
      >
        {/* Drag handle */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: '#2e2e2e' }} />
        </div>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          {view !== 'menu' ? (
            <button
              onClick={() => setView('menu')}
              style={{ background: 'none', border: 'none', color: '#6b6b6b', cursor: 'pointer', padding: 0, display: 'flex' }}
            >
              <ArrowLeft size={20} />
            </button>
          ) : (
            <div style={{ width: 20 }} />
          )}
          <span style={{ fontSize: 16, fontWeight: 600 }}>
            {view === 'menu' ? 'Actions' : view === 'move' ? 'Move to collection' : 'Tags'}
          </span>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#6b6b6b', cursor: 'pointer', padding: 0, display: 'flex' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Menu view */}
        {view === 'menu' && (
          <div>
            {actionRow(<Download size={18} />, 'Download', handleDownload)}
            {actionRow(<ArrowRight size={18} />, 'Move to collection', () => setView('move'))}
            {actionRow(<Tag size={18} />, 'Change tags', () => setView('tags'))}
            {actionRow(<Trash2 size={18} />, 'Trash', handleTrash, true)}
            {actionRow(<RotateCcw size={18} />, 'Re-add to queue', handleReadd)}
          </div>
        )}

        {/* Move view */}
        {view === 'move' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {collections.map((col) => {
              const currentCollection = imagePath?.split('/')[0];
              const isCurrentCollection = col.folder === currentCollection;
              return (
                <button
                  key={col.folder}
                  onClick={() => {
                    console.log('Collection button clicked:', col.folder, { isCurrentCollection, busy });
                    if (!isCurrentCollection) {
                      handleMove(col.folder);
                    }
                  }}
                  disabled={busy || isCurrentCollection}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 14px',
                    background: isCurrentCollection ? '#1e1e1e' : '#1e1e1e',
                    border: `1.5px solid ${isCurrentCollection ? '#2a2a2a' : '#2a2a2a'}`,
                    borderRadius: 10,
                    color: isCurrentCollection ? '#3a3a3a' : '#d0cdc8',
                    fontSize: 14,
                    cursor: busy || isCurrentCollection ? 'default' : 'pointer',
                    fontFamily: 'inherit',
                    textAlign: 'left',
                    opacity: busy || isCurrentCollection ? 0.4 : 1,
                  }}
                  title={isCurrentCollection ? 'Image is already in this collection' : undefined}
                >
                  <span style={{ fontSize: 18 }}>{col.emoji || '📁'}</span>
                  <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <span>{col.name}</span>
                    {isCurrentCollection && <span style={{ fontSize: 12, color: '#3a3a3a', marginTop: 2 }}>Current</span>}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Tags view */}
        {view === 'tags' && (
          <div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {allTags.map((tag) => {
                const active = imageTags.includes(tag);
                return (
                  <button
                    key={tag}
                    onClick={() => handleToggleTag(tag)}
                    style={{
                      padding: '6px 12px',
                      background: active ? 'oklch(65% 0.18 145 / 0.2)' : '#1e1e1e',
                      border: `1px solid ${active ? 'oklch(65% 0.18 145 / 0.6)' : '#2a2a2a'}`,
                      borderRadius: 16,
                      fontSize: 13,
                      color: active ? 'oklch(65% 0.18 145)' : '#b0b0b0',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      transition: 'all 0.15s',
                    }}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>

            {showTagInput ? (
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  ref={tagInputRef}
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddNewTag()}
                  placeholder="New tag..."
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    background: '#1e1e1e',
                    border: '1.5px solid #2a2a2a',
                    borderRadius: 10,
                    color: '#f0ede8',
                    fontSize: 14,
                    fontFamily: 'inherit',
                    outline: 'none',
                  }}
                />
                <button
                  onClick={handleAddNewTag}
                  style={{
                    padding: '10px 16px',
                    background: 'oklch(65% 0.18 145)',
                    border: 'none',
                    borderRadius: 10,
                    color: '#0a0a0a',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  Add
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowTagInput(true)}
                style={{
                  padding: '8px 14px',
                  background: '#1e1e1e',
                  border: '1.5px dashed #2a2a2a',
                  borderRadius: 16,
                  fontSize: 13,
                  color: '#6b6b6b',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                + New tag
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
