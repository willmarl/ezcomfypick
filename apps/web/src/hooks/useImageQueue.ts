import { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import type { UndoDescriptor } from '../types';

export interface UseImageQueueReturn {
  images: string[];
  isLoading: boolean;
  error: Error | null;
  canUndo: boolean;
  swipeKeep: (path: string, collection: string) => Promise<void>;
  swipeTrash: (path: string) => Promise<void>;
  undo: () => Promise<void>;
  reload: () => Promise<void>;
}

export const useImageQueue = (apiUrl: string = ''): UseImageQueueReturn => {
  const [images, setImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [undoEntry, setUndoEntry] = useState<UndoDescriptor | null>(null);

  const fetchImages = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const imgs = await apiClient.getImages(apiUrl);
      setImages(imgs);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch images'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, [apiUrl]);

  const swipeKeep = async (path: string, collection: string) => {
    try {
      const result = await apiClient.swipeKeep(path, collection, apiUrl);
      if (result.ok) {
        setImages((prev) => prev.filter((p) => p !== path));
        setUndoEntry(result.undo);
      }
    } catch (err) {
      console.error('Failed to keep image:', err);
      throw err;
    }
  };

  const swipeTrash = async (path: string) => {
    try {
      const result = await apiClient.swipeTrash(path, apiUrl);
      if (result.ok) {
        setImages((prev) => prev.filter((p) => p !== path));
        setUndoEntry(result.undo);
      }
    } catch (err) {
      console.error('Failed to trash image:', err);
      throw err;
    }
  };

  const undo = async () => {
    if (!undoEntry) return;
    try {
      const result = await apiClient.swipeUndo(undoEntry, apiUrl);
      if (result.ok) {
        // Find the image path from undo entry
        const imagePath = undoEntry.image_path;
        // Prepend it back to the front of the queue
        setImages((prev) => [imagePath, ...prev]);
        setUndoEntry(null);
      }
    } catch (err) {
      console.error('Failed to undo:', err);
      throw err;
    }
  };

  const reload = async () => {
    setUndoEntry(null);
    await fetchImages();
  };

  return {
    images,
    isLoading,
    error,
    canUndo: undoEntry !== null,
    swipeKeep,
    swipeTrash,
    undo,
    reload,
  };
};
