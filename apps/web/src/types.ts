export interface Collection {
  name: string;
  icon: string;
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
