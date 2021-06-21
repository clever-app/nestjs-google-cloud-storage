import { CreateWriteStreamOptions } from '@google-cloud/storage';
import { IGCloudStorageOptions } from './gcloud-storage-options.interface';
export interface IGCloudStoragePerRequestOptions extends IGCloudStorageOptions {
  /**
   * Override writeStreamOptions
   */
  writeStreamOptions?: CreateWriteStreamOptions;

  /**
   * Filename prefix (Folder name)
   * @example attachments
   * @example static/css
   */
  prefix?: string;
}
