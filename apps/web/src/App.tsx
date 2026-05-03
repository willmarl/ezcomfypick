import { useState, useRef, useEffect } from 'react';
import { Toaster, toast } from 'sonner';
import { useImageQueue } from './hooks/useImageQueue';
import { useCollections } from './hooks/useCollections';
import type { AppSettings } from './types';
import { CardStack } from './components/CardStack';
import { ActionButtons } from './components/ActionButtons';
import { PillBar } from './components/PillBar';
import { Header } from './components/Header';
import { EmptyState } from './components/EmptyState';
import { NewCollectionSheet } from './components/sheets/NewCollectionSheet';
import { SettingsSheet } from './components/sheets/SettingsSheet';

const SETTINGS_STORAGE_KEY = 'ezcomfypick_settings';

const getStoredSettings = (): AppSettings => {
  try {
    const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : { apiUrl: '', haptic: true };
  } catch {
    return { apiUrl: '', haptic: true };
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
  const cardStackRef = useRef<any>(null);

  const imageQueue = useImageQueue(settings.apiUrl);
  const collections = useCollections(settings.apiUrl);

  // Auto-select first collection
  useEffect(() => {
    if (collections.collections.length > 0 && !selectedCollection) {
      setSelectedCollection(collections.collections[0].name);
    }
  }, [collections.collections, selectedCollection]);

  const handleSwipe = async (dir: 'left' | 'right', imagePath: string) => {
    try {
      if (settings.haptic && navigator.vibrate) {
        navigator.vibrate(dir === 'right' ? [20] : [10, 30, 10]);
      }

      if (dir === 'right') {
        await imageQueue.swipeKeep(imagePath, selectedCollection);
        const col = collections.collections.find((c) => c.name === selectedCollection);
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

  const handleCreateCollection = async (name: string) => {
    try {
      await collections.createCollection(name);
      setSelectedCollection(name);
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

      <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
        {imageQueue.images.length === 0 ? (
          <EmptyState onReload={imageQueue.reload} />
        ) : (
          <CardStack ref={cardStackRef} images={imageQueue.images} onSwipe={handleSwipe} />
        )}
      </div>

      {imageQueue.images.length > 0 && (
        <ActionButtons
          onLeft={() => handleButtonSwipe('left')}
          onRight={() => handleButtonSwipe('right')}
          disabled={false}
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

      <Toaster position="bottom-center" />
    </div>
  );
}
