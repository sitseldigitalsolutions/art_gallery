import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { config } from '../../config/env.js';
import { notFound } from '../../shared/errors.js';
import { StoragePaths, type StorageArea, type StorageProvider, type Visibility } from './types.js';

const MIME_BY_EXT: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.pdf': 'application/pdf',
  '.zip': 'application/zip',
};

/** Files live under <LOCAL_UPLOAD_DIR>/{public|private}/<area>/<file>. Only /public is served statically. */
export class LocalStorageProvider implements StorageProvider {
  readonly root = path.resolve(config.LOCAL_UPLOAD_DIR);

  private resolve(key: string, visibility: Visibility) {
    const base = path.join(this.root, visibility);
    const full = path.resolve(base, key);
    // Path traversal guard: the resolved path must remain inside the visibility root.
    if (!full.startsWith(base + path.sep)) throw notFound('File');
    return full;
  }

  async put(area: StorageArea, filename: string, body: Buffer, contentType: string) {
    const { prefix, visibility } = StoragePaths[area];
    const key = `${prefix}/${filename}`;
    const full = this.resolve(key, visibility);
    await fsp.mkdir(path.dirname(full), { recursive: true });
    await fsp.writeFile(full, body);
    return { key, visibility, url: visibility === 'public' ? this.publicUrl(key) : null, size: body.length, contentType };
  }

  async getStream(key: string, visibility: Visibility) {
    const full = this.resolve(key, visibility);
    const stat = await fsp.stat(full).catch(() => null);
    if (!stat?.isFile()) throw notFound('File');
    return {
      stream: fs.createReadStream(full),
      contentType: MIME_BY_EXT[path.extname(full).toLowerCase()] ?? 'application/octet-stream',
      size: stat.size,
    };
  }

  async delete(key: string, visibility: Visibility) {
    await fsp.rm(this.resolve(key, visibility), { force: true });
  }

  publicUrl(key: string) {
    return `${config.API_PUBLIC_URL}/media/${key}`;
  }
}
