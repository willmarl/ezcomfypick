export interface Collection {
  folder: string;
  name: string;
  emoji?: string;
  description?: string;
  image_count: number;
}

export interface UndoDescriptor {
  image_path: string;
  action: 'keep' | 'trash';
  collection?: string;
}

export interface AppSettings {
  apiUrl: string;
  haptic: boolean;
}
