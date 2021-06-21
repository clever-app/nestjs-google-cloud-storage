import { IGCloudStorageOptions } from './gcloud-storage-options.interface';
import { ModuleMetadata } from '@nestjs/common/interfaces';
export interface IGCloudStorageAsyncOptions
  extends Pick<ModuleMetadata, 'imports'> {
  name?: string;
  useFactory?: (
    ...args: any[]
  ) => Promise<IGCloudStorageOptions> | IGCloudStorageOptions;
  inject?: any[];
}
