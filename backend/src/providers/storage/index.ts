import { config } from '../../config/env.js';
import { LocalStorageProvider } from './local.js';
import { S3StorageProvider } from './s3.js';
import type { StorageProvider } from './types.js';

export * from './types.js';

function create(): StorageProvider {
  if (config.STORAGE_PROVIDER === 's3') {
    if (!config.AWS_S3_BUCKET || !config.AWS_REGION) {
      throw new Error('STORAGE_PROVIDER=s3 requires AWS_S3_BUCKET and AWS_REGION');
    }
    return new S3StorageProvider();
  }
  return new LocalStorageProvider();
}

export const storage = create();
