import { useState, useRef, useEffect } from 'react';
import { Toaster, toast } from 'sonner';
import { useImageQueue } from './hooks/useImageQueue';
import { useCollections } from './hooks/useCollections';
import type { AppSettings } from './types';
import { CardStack } from './components/CardStack';
import { ActionButtons } from './components/ActionButtons';
import { TagBar } from './components/TagBar';
import { PillBar } from './components/PillBar';
import { Header } from './components/Header';
import { EmptyState } from './components/EmptyState';
import { NewCollectionSheet } from './components/sheets/NewCollectionSheet';
import { SettingsSheet } from './components/sheets/SettingsSheet';

const SETTINGS_STORAGE_KEY = 'ezcomfypick_settings';

const getStoredSettings = (): AppSettings => {
  try {
    const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : { haptic: true };
  } catch {
    return { haptic: true };
  }
};

const saveSettings = (settings: AppSettings) => {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    console.warn('Failed to save settings');
  }
};

export default function App() {
  const [settings, setSettings] = useState<AppSettings>(getStoredSettings);
  const [selectedCollection, setSelectedCollection] = useState<string>('');
  const [showNewCollection, setShowNewCollection] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [backendReady, setBackendReady] = useState<boolean | null>(null);
  const [isMagnified, setIsMagnified] = useState(false);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const cardStackRef = useRef<any>(null);

  const imageQueue = useImageQueue();
  const collections = useCollections();

  // Check backend connectivity on mount
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const response = await fetch('/api/hello', { method: 'GET' });
        setBackendReady(response.ok);
      } catch {
        setBackendReady(false);
      }
    };

    checkBackend();
    const interval = setInterval(checkBackend, 3000);
    return () => clearInterval(interval);
  }, []);

  // Auto-select first collection
  useEffect(() => {
    if (collections.collections.length > 0 && !selectedCollection) {
      setSelectedCollection(collections.collections[0].folder);
    }
  }, [collections.collections, selectedCollection]);

  const handleSwipe = async (dir: 'left' | 'right', imagePath: string) => {
    try {
      setIsMagnified(false);
      if (settings.haptic && navigator.vibrate) {
        navigator.vibrate(dir === 'right' ? [20] : [10, 30, 10]);
      }

      // Append selected tags to image before swiping
      if (selectedTags.size > 0) {
        for (const tag of selectedTags) {
          try {
            await fetch(`/api/images/${imagePath}/tags`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ tag }),
            });
          } catch (err) {
            console.error(`Failed to add tag ${tag}:`, err);
          }
        }
      }

      if (dir === 'right') {
        await imageQueue.swipeKeep(imagePath, selectedCollection);
        const col = collections.collections.find((c) => c.folder === selectedCollection);
        toast.success(`Kept → ${col?.name || selectedCollection}`);
      } else {
        await imageQueue.swipeTrash(imagePath);
        toast.success('Moved to trash');
      }
    } catch (err) {
      console.error('Swipe failed:', err);
      toast.error('Failed to process swipe');
    }
  };

  const handleUndo = async () => {
    try {
      await imageQueue.undo();
      toast.success('Undone ↩');
    } catch (err) {
      console.error('Undo failed:', err);
      toast.error('Failed to undo');
    }
  };

  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
    toast.success('Settings saved');
  };

  const handleCreateCollection = async (name: string, emoji: string) => {
    try {
      const collection = await collections.createCollection(name);
      // If emoji is not default, update the collection with it
      if (emoji !== '📁') {
        await collections.updateCollection(collection.folder, { emoji });
      }
      setSelectedCollection(collection.folder);
      setShowNewCollection(false);
      toast.success(`Collection "${name}" created`);
    } catch (err) {
      console.error('Failed to create collection:', err);
      toast.error('Failed to create collection');
    }
  };

  const handleButtonSwipe = (dir: 'left' | 'right') => {
    if (imageQueue.images.length === 0) return;
    cardStackRef.current?.flyOut(dir);
  };

  if (backendReady === false) {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#090909',
          color: '#f0ede8',
          gap: 24,
          padding: 20,
        }}
      >
        <div style={{ fontSize: 64 }}>⚠️</div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>Backend Unreachable</div>
          <div style={{ fontSize: 14, color: '#6b6b6b', marginBottom: 24 }}>
            The server may be starting up. Please wait...
          </div>
        </div>
        <button
          onClick={() => setBackendReady(null)}
          style={{
            padding: '12px 24px',
            background: 'oklch(65% 0.18 145)',
            border: 'none',
            borderRadius: 8,
            color: '#0a0a0a',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
            fontFamily: "'DM Sans', sans-serif",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '0.9';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '1';
          }}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: '#090909',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Header
        count={imageQueue.images.length}
        canUndo={imageQueue.canUndo}
        onUndo={handleUndo}
        onSettings={() => setShowSettings(true)}
      />

      {imageQueue.images.length > 0 && (
        <ActionButtons
          onLeft={() => handleButtonSwipe('left')}
          onRight={() => handleButtonSwipe('right')}
          disabled={false}
          isMagnified={isMagnified}
          onToggleMagnify={() => setIsMagnified(m => !m)}
        />
      )}

      <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
        {imageQueue.images.length === 0 ? (
          <EmptyState onReload={imageQueue.reload} />
        ) : (
          <CardStack ref={cardStackRef} images={imageQueue.images} onSwipe={handleSwipe} isMagnified={isMagnified} />
        )}
      </div>

      {imageQueue.images.length > 0 && (
        <TagBar
          imagePath={imageQueue.images[0] ?? null}
          selectedTags={selectedTags}
          onToggleTag={(tag) => {
            const newTags = new Set(selectedTags);
            if (newTags.has(tag)) {
              newTags.delete(tag);
            } else {
              newTags.add(tag);
            }
            setSelectedTags(newTags);
          }}
          onAddTag={(tag) => {
            const newTags = new Set(selectedTags);
            newTags.add(tag);
            setSelectedTags(newTags);
          }}
        />
      )}

      <PillBar
        collections={collections.collections}
        selected={selectedCollection}
        onSelect={setSelectedCollection}
        onNew={() => setShowNewCollection(true)}
      />

      <NewCollectionSheet
        visible={showNewCollection}
        onClose={() => setShowNewCollection(false)}
        onCreate={handleCreateCollection}
      />

      <SettingsSheet
        visible={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings}
        onSave={handleSaveSettings}
      />

      <Toaster position="top-left" />
    </div>
  );
}
