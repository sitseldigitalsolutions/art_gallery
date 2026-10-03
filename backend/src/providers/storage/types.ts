import type { Readable } from 'node:stream';

export type Visibility = 'public' | 'private';

/** Logical storage areas. Private areas are never served without authorization. */
export const StoragePaths = {
  artworks: { prefix: 'artworks', visibility: 'public' },
  artists: { prefix: 'artists', visibility: 'public' },
  galleries: { prefix: 'galleries', visibility: 'public' },
  reviews: { prefix: 'reviews', visibility: 'public' },
  site: { prefix: 'site', visibility: 'public' },
  artistDocuments: { prefix: 'artist-documents', visibility: 'private' },
  customArtSource: { prefix: 'custom-art/source', visibility: 'private' },
  customArtPreview: { prefix: 'custom-art/preview', visibility: 'private' },
  customArtFinal: { prefix: 'custom-art/final', visibility: 'private' },
  digitalArt: { prefix: 'digital-art', visibility: 'private' },
} as const satisfies Record<string, { prefix: string; visibility: Visibility }>;

export type StorageArea = keyof typeof StoragePaths;

export interface StoredObject {
  key: string;
  visibility: Visibility;
  /** Public URL for public objects; null for private ones. */
  url: string | null;
  size: number;
  contentType: string;
}

export interface StorageProvider {
  put(area: StorageArea, filename: string, body: Buffer, contentType: string): Promise<StoredObject>;
  getStream(key: string, visibility: Visibility): Promise<{ stream: Readable; contentType: string; size?: number }>;
  delete(key: string, visibility: Visibility): Promise<void>;
  publicUrl(key: string): string;
}
