import ky from 'ky';
import type { UndoDescriptor } from '../types';

const getBaseUrl = (apiUrl: string): string => {
  if (apiUrl) return apiUrl;
  return typeof window !== 'undefined' ? window.location.origin : '';
};

const createClient = (apiUrl: string = '') => {
  const baseUrl = getBaseUrl(apiUrl);
  return ky.create({ prefix: baseUrl ? `${baseUrl}/api` : '/api' });
};

export const apiClient = {
  init: (apiUrl: string = '') => createClient(apiUrl),

  getImages: async (apiUrl: string = ''): Promise<string[]> => {
    const client = createClient(apiUrl);
    const res = await client.get('images').json<{ images: string[] }>();
    return res.images;
  },

  getImageUrl: (path: string, apiUrl: string = ''): string => {
    const baseUrl = getBaseUrl(apiUrl);
    const prefix = baseUrl ? `${baseUrl}/api` : '/api';
    return `${prefix}/image-file/${path}`;
  },

  swipeKeep: async (imagePath: string, collection: string, apiUrl: string = ''): Promise<{ ok: boolean; undo: UndoDescriptor }> => {
    const client = createClient(apiUrl);
    return client.post('swipe/keep', {
      json: { image_path: imagePath, collection },
    }).json();
  },

  swipeTrash: async (imagePath: string, apiUrl: string = ''): Promise<{ ok: boolean; undo: UndoDescriptor }> => {
    const client = createClient(apiUrl);
    return client.post('swipe/trash', {
      json: { image_path: imagePath },
    }).json();
  },

  swipeUndo: async (undo: UndoDescriptor, apiUrl: string = ''): Promise<{ ok: boolean }> => {
    const client = createClient(apiUrl);
    return client.post('swipe/undo', {
      json: undo,
    }).json();
  },

  getCollections: async (apiUrl: string = ''): Promise<any[]> => {
    const client = createClient(apiUrl);
    const res = await client.get('collections').json<{ collections: any[] }>();
    return res.collections;
  },

  createCollection: async (name: string, apiUrl: string = ''): Promise<any> => {
    const client = createClient(apiUrl);
    return client.post('collections', {
      json: { name },
    }).json();
  },

  updateCollection: async (folder: string, data: { name?: string; emoji?: string; description?: string }, apiUrl: string = ''): Promise<any> => {
    const client = createClient(apiUrl);
    return client.put(`collections/${folder}`, {
      json: data,
    }).json();
  },

  renameCollection: async (folder: string, newName: string, apiUrl: string = ''): Promise<any> => {
    const client = createClient(apiUrl);
    return client.patch(`collections/${folder}/rename`, {
      json: { new_name: newName },
    }).json();
  },

  deleteCollection: async (folder: string, apiUrl: string = ''): Promise<{ ok: boolean; moved: number }> => {
    const client = createClient(apiUrl);
    return client.delete(`collections/${folder}`).json();
  },

  getTags: async (imagePath: string, apiUrl: string = ''): Promise<string[]> => {
    const client = createClient(apiUrl);
    const res = await client.get(`images/${imagePath}/tags`).json<{ tags: string[] }>();
    return res.tags;
  },

  addTag: async (imagePath: string, tag: string, apiUrl: string = ''): Promise<{ ok: boolean }> => {
    const client = createClient(apiUrl);
    return client.post(`images/${imagePath}/tags`, {
      json: { tag },
    }).json();
  },

  removeTag: async (imagePath: string, tag: string, apiUrl: string = ''): Promise<{ ok: boolean }> => {
    const client = createClient(apiUrl);
    return client.delete(`images/${imagePath}/tags/${tag}`).json();
  },

  getAllTags: async (apiUrl: string = ''): Promise<string[]> => {
    const client = createClient(apiUrl);
    const res = await client.get('tags').json<{ tags: string[] }>();
    return res.tags;
  },

  getGalleryImages: async (
    collection: string | undefined,
    tags: string[] | undefined,
    offset: number = 0,
    limit: number = 30,
    apiUrl: string = ''
  ): Promise<{ images: string[]; has_more: boolean }> => {
    const client = createClient(apiUrl);
    const params = new URLSearchParams();
    if (collection) params.append('collection', collection);
    if (tags && tags.length > 0) params.append('tags', tags.join(','));
    params.append('offset', offset.toString());
    params.append('limit', limit.toString());
    return client.get(`gallery/images?${params.toString()}`).json();
  },

  getGalleryImageTags: async (imagePath: string): Promise<string[]> => {
    const client = createClient();
    const res = await client.get(`gallery/images/${imagePath}/tags`).json<{ tags: string[] }>();
    return res.tags;
  },

  addGalleryImageTag: async (imagePath: string, tag: string): Promise<{ ok: boolean }> => {
    const client = createClient();
    return client.post(`gallery/images/${imagePath}/tags`, {
      json: { tag },
    }).json();
  },

  removeGalleryImageTag: async (imagePath: string, tag: string): Promise<{ ok: boolean }> => {
    const client = createClient();
    return client.delete(`gallery/images/${imagePath}/tags/${tag}`).json();
  },

  galleryMove: async (fromPath: string, toCollection: string): Promise<{ ok: boolean; new_path: string }> => {
    const client = createClient();
    return client.post('gallery/move', {
      json: { from_path: fromPath, to_collection: toCollection },
    }).json();
  },

  galleryTrash: async (path: string): Promise<{ ok: boolean }> => {
    const client = createClient();
    return client.post('gallery/trash', { json: { path } }).json();
  },

  galleryReadd: async (path: string): Promise<{ ok: boolean }> => {
    const client = createClient();
    return client.post('gallery/readd', { json: { path } }).json();
  },

  getGalleryImageUrl: (path: string): string => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const prefix = baseUrl ? `${baseUrl}/api` : '/api';
    return `${prefix}/gallery/image/${path}`;
  },

  getTrashImages: async (offset: number = 0, limit: number = 30): Promise<{ images: string[]; has_more: boolean }> => {
    const client = createClient();
    const params = new URLSearchParams();
    params.append('offset', offset.toString());
    params.append('limit', limit.toString());
    return client.get(`trash/images?${params.toString()}`).json();
  },

  getTrashImageUrl: (path: string): string => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const prefix = baseUrl ? `${baseUrl}/api` : '/api';
    return `${prefix}/trash/image/${path}`;
  },

  trashReadd: async (path: string): Promise<{ ok: boolean }> => {
    const client = createClient();
    return client.post('trash/readd', { json: { path } }).json();
  },

  trashDelete: async (path: string): Promise<{ ok: boolean }> => {
    const client = createClient();
    return client.delete(`trash/image/${path}`).json();
  },

  trashEmpty: async (): Promise<{ ok: boolean; deleted: number }> => {
    const client = createClient();
    return client.post('trash/empty', { json: {} }).json();
  },

  renameTag: async (oldTag: string, newTag: string): Promise<{ ok: boolean; old_tag: string; new_tag: string }> => {
    const client = createClient();
    return client.patch(`tags/${encodeURIComponent(oldTag)}/rename`, {
      json: { new_tag: newTag },
    }).json();
  },

  deleteTag: async (tag: string): Promise<{ ok: boolean }> => {
    const client = createClient();
    return client.delete(`tags/${encodeURIComponent(tag)}`).json();
  },

  getQueueImages: async (offset: number = 0, limit: number = 30): Promise<{ images: string[]; has_more: boolean }> => {
    const client = createClient();
    const params = new URLSearchParams();
    params.append('offset', offset.toString());
    params.append('limit', limit.toString());
    return client.get(`queue/images?${params.toString()}`).json();
  },

  getQueueImageUrl: (path: string): string => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const prefix = baseUrl ? `${baseUrl}/api` : '/api';
    return `${prefix}/image-file/${path}`;
  },

  queueMove: async (fromPath: string, toCollection: string): Promise<{ ok: boolean; new_path: string }> => {
    const client = createClient();
    return client.post('queue/move', {
      json: { from_path: fromPath, to_collection: toCollection },
    }).json();
  },
};
