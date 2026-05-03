import { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import type { Collection } from '../types';

export interface UseCollectionsReturn {
  collections: Collection[];
  isLoading: boolean;
  error: Error | null;
  createCollection: (name: string) => Promise<Collection>;
  updateCollection: (folder: string, data: { name?: string; emoji?: string; description?: string }) => Promise<Collection>;
  refetch: () => Promise<void>;
}

export const useCollections = (apiUrl: string = ''): UseCollectionsReturn => {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchCollections = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const collections = await apiClient.getCollections(apiUrl);
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

  const createCollection = async (name: string): Promise<Collection> => {
    try {
      const result = await apiClient.createCollection(name, apiUrl);
      if (result.collection) {
        setCollections((prev) => [...prev, result.collection]);
        return result.collection;
      }
      throw new Error('No collection returned from API');
    } catch (err) {
      console.error('Failed to create collection:', err);
      throw err;
    }
  };

  const updateCollection = async (folder: string, data: { name?: string; emoji?: string; description?: string }): Promise<Collection> => {
    try {
      const updated = await apiClient.updateCollection(folder, data, apiUrl);
      setCollections((prev) =>
        prev.map((col) => (col.folder === folder ? updated : col))
      );
      return updated;
    } catch (err) {
      console.error('Failed to update collection:', err);
      throw err;
    }
  };

  return {
    collections,
    isLoading,
    error,
    createCollection,
    updateCollection,
    refetch: fetchCollections,
  };
};
