import { useState, useRef, useEffect, useCallback } from 'react';
import { Toaster, toast } from 'sonner';
import { useImageQueue } from '../hooks/useImageQueue';
import { useCollections } from '../hooks/useCollections';
import type { AppSettings } from '../types';
import { CardStack } from '../components/CardStack';
import { ActionButtons } from '../components/ActionButtons';
import { TagBar } from '../components/TagBar';
import { PillBar } from '../components/PillBar';
import { Header } from '../components/Header';
import { EmptyState } from '../components/EmptyState';
import { NewCollectionSheet } from '../components/sheets/NewCollectionSheet';
import { SettingsSheet } from '../components/sheets/SettingsSheet';

interface SwipePageProps {
  settings: AppSettings;
  onSettingsSave: (settings: AppSettings) => void;
}

const SETTINGS_STORAGE_KEY = 'ezcomfypick_settings';

const saveSettings = (settings: AppSettings) => {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    console.warn('Failed to save settings');
  }
};

export const SwipePage: React.FC<SwipePageProps> = ({ settings, onSettingsSave }) => {
  const imageQueue = useImageQueue();
  const collections = useCollections();

  // Initialize selectedCollection with first collection folder once collections load
  const [selectedCollection, setSelectedCollection] = useState<string>(() => {
    return collections.collections.length > 0 ? collections.collections[0].folder : '';
  });

  const [showNewCollection, setShowNewCollection] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isMagnified, setIsMagnified] = useState(false);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const cardStackRef = useRef<any>(null);

  // Update selectedCollection when collections change (if not already manually set)
  useEffect(() => {
    if (collections.collections.length > 0 && !selectedCollection) {
      console.log('Setting default collection:', collections.collections[0].folder);
      setSelectedCollection(collections.collections[0].folder);
    }
  }, [collections.collections.length]);

  const handleSwipe = useCallback(async (dir: 'left' | 'right', imagePath: string) => {
    try {
      setIsMagnified(false);
      if (settings.haptic && navigator.vibrate) {
        navigator.vibrate([20]);
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
      } else {
        await imageQueue.swipeTrash(imagePath);
      }
    } catch (err) {
      console.error('Swipe failed:', err);
      toast.error('Failed to process swipe');
    }
  }, [selectedCollection, selectedTags, imageQueue, settings]);

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
    onSettingsSave(newSettings);
    saveSettings(newSettings);
    toast.success('Settings saved');
  };

  const handleCreateCollection = async (name: string, emoji: string) => {
    try {
      const collection = await collections.createCollection(name);
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
          isMagnified={isMagnified}
          onToggleMagnify={() => setIsMagnified(m => !m)}
        />
      )}

      <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
        {imageQueue.images.length === 0 ? (
          <EmptyState onReload={imageQueue.reload} />
        ) : selectedCollection ? (
          <CardStack ref={cardStackRef} images={imageQueue.images} onSwipe={handleSwipe} isMagnified={isMagnified} />
        ) : (
          <EmptyState onReload={imageQueue.reload} />
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
};
