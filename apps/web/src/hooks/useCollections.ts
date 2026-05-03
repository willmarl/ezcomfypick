import { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import type { Collection } from '../types';

const STORAGE_KEY = 'ezcomfypick_collection_icons';

const getStoredIcons = (): Record<string, string> => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

const saveStoredIcons = (icons: Record<string, string>) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(icons));
  } catch {
    console.warn('Failed to save collection icons to localStorage');
  }
};

export interface UseCollectionsReturn {
  collections: Collection[];
  isLoading: boolean;
  error: Error | null;
  createCollection: (name: string) => Promise<void>;
}

export const useCollections = (apiUrl: string = ''): UseCollectionsReturn => {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchCollections = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const names = await apiClient.getCollections(apiUrl);
      const icons = getStoredIcons();

      const collections: Collection[] = names.map((name) => ({
        name,
        icon: icons[name] || '📁',
      }));

      setCollections(collections);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch collections'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCollections();
  }, [apiUrl]);

  const createCollection = async (name: string) => {
    try {
      const result = await apiClient.createCollection(name, apiUrl);
      if (result.ok) {
        const icons = getStoredIcons();
        icons[name] = '📁';
        saveStoredIcons(icons);

        setCollections((prev) => [...prev, { name, icon: '📁' }]);
      }
    } catch (err) {
      console.error('Failed to create collection:', err);
      throw err;
    }
  };

  return {
    collections,
    isLoading,
    error,
    createCollection,
  };
};
