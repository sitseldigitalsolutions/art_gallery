import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import type { Readable } from 'node:stream';
import { config } from '../../config/env.js';
import { StoragePaths, type StorageArea, type StorageProvider, type Visibility } from './types.js';

/**
 * S3-compatible storage. Public objects live under "public/", private ones under "private/".
 * The bucket must NOT grant public read on "private/*". Private objects are always streamed
 * through the API's authorized endpoints, never by a permanent URL.
 */
export class S3StorageProvider implements StorageProvider {
  private client = new S3Client({
    region: config.AWS_REGION,
    endpoint: config.AWS_S3_ENDPOINT || undefined,
    forcePathStyle: Boolean(config.AWS_S3_ENDPOINT),
    credentials:
      config.AWS_ACCESS_KEY_ID && config.AWS_SECRET_ACCESS_KEY
        ? { accessKeyId: config.AWS_ACCESS_KEY_ID, secretAccessKey: config.AWS_SECRET_ACCESS_KEY }
        : undefined,
  });
  private bucket = config.AWS_S3_BUCKET!;

  async put(area: StorageArea, filename: string, body: Buffer, contentType: string) {
    const { prefix, visibility } = StoragePaths[area];
    const key = `${prefix}/${filename}`;
    await this.client.send(
      new PutObjectCommand({ Bucket: this.bucket, Key: `${visibility}/${key}`, Body: body, ContentType: contentType }),
    );
    return { key, visibility, url: visibility === 'public' ? this.publicUrl(key) : null, size: body.length, contentType };
  }

  async getStream(key: string, visibility: Visibility) {
    const res = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: `${visibility}/${key}` }));
    return {
      stream: res.Body as Readable,
      contentType: res.ContentType ?? 'application/octet-stream',
      size: res.ContentLength,
    };
  }

  async delete(key: string, visibility: Visibility) {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: `${visibility}/${key}` }));
  }

  publicUrl(key: string) {
    if (config.AWS_S3_ENDPOINT) return `${config.AWS_S3_ENDPOINT}/${this.bucket}/public/${key}`;
    return `https://${this.bucket}.s3.${config.AWS_REGION}.amazonaws.com/public/${key}`;
  }
}
