import { DynamicModule, Module } from '@nestjs/common';
import { GCLOUD_STORAGE_MODULE_OPTIONS } from './constants/gcloud-storage.constants';
import { IGCloudStorageAsyncOptions } from './interfaces/gcloud-storage-async-options.interface';
import { IGCloudStorageOptions } from './interfaces/gcloud-storage-options.interface';
import { GCloudStorageService } from './services/gcloud-storage.service';

@Module({
  providers: [GCloudStorageService],
  exports: [GCloudStorageService],
})
export class GCloudStorageModule {
  static forRoot(options: IGCloudStorageOptions): DynamicModule {
    const gcsModuleOptions = {
      provide: GCLOUD_STORAGE_MODULE_OPTIONS,
      useValue: options,
    };

    const gcsServiceProvider = {
      provide: GCloudStorageService,
      useFactory: (opt: IGCloudStorageOptions) => new GCloudStorageService(opt),
      inject: [GCLOUD_STORAGE_MODULE_OPTIONS],
    };

    return {
      module: GCloudStorageModule,
      providers: [gcsModuleOptions, gcsServiceProvider],
      exports: [GCloudStorageService],
    };
  }

  static forRootAsync(options: IGCloudStorageAsyncOptions): DynamicModule {
    const gcsServiceProvider = {
      provide: GCloudStorageService,
      useFactory: (opt: IGCloudStorageOptions) => new GCloudStorageService(opt),
      inject: [GCLOUD_STORAGE_MODULE_OPTIONS],
    };

    return {
      module: GCloudStorageModule,
      imports: options.imports,
      providers: [
        {
          // for useFactory
          provide: GCLOUD_STORAGE_MODULE_OPTIONS,
          useFactory: options.useFactory,
          inject: options.inject || [],
        },
        gcsServiceProvider,
      ],
      exports: [GCloudStorageService],
    };
  }
}
