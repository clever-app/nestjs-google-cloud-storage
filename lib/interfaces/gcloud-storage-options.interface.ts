import { PredefinedAcl, StorageOptions } from '@google-cloud/storage';

export interface IGCloudStorageOptions extends StorageOptions {
  /**
   * Bucket
   */
  bucketName: string;

  /**
   * Base URI
   */
  storageBaseUri?: string;

  /**
   * Set default predefined ACL
   * @default publicRead
   */
  predefinedAcl?: PredefinedAcl;
}
