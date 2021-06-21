import {
  Bucket,
  CreateWriteStreamOptions,
  Storage,
} from '@google-cloud/storage';
import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  GCLOUD_STORAGE_BASE_URL,
  GCLOUD_STORAGE_DOMAIN,
  GCLOUD_STORAGE_MODULE_OPTIONS,
} from '../constants/gcloud-storage.constants';
import { IGCloudStorageOptions } from '../interfaces/gcloud-storage-options.interface';
import { IGCloudStoragePerRequestOptions } from '../interfaces/gcloud-storage-per-request-options.interface';
import { IUploadedFileMetadata } from '../interfaces/uploaded-file-metadata.interface';
import { uuid } from '../utils/uuid.utils';

@Injectable()
export class GCloudStorageService {
  private readonly logger = new Logger(GCloudStorageService.name);

  // Storage contenant les services
  public storage: Storage = null;
  public bucket: Bucket = null;

  constructor(
    @Inject(GCLOUD_STORAGE_MODULE_OPTIONS)
    private options: IGCloudStorageOptions
  ) {
    this.logger.debug(
      `${GCloudStorageService.name}.options: ${
        options ? JSON.stringify(options) : null
      }`
    );

    // initialisation du client
    this.storage = new Storage(this.options);

    // initialisation du bucket à partir de la configuration
    this.bucket = this.storage.bucket(this.options.bucketName);

    // vérifier la référence sur le bucket
    if (!this.bucket) {
      throw new Error(
        `Failed to initialize Google Storage bucket instance with option: ${options}.`
      );
    }
  }

  /**
   * Upload file in bucket on Google Cloud Storage
   *
   * @param {UploadedFileMetadata} fileMetadata
   * @param {Partial<IGCloudStoragePerRequestOptions>} [perRequestOptions=null]
   * @returns {Promise<string>}
   * @memberof GCloudStorageService
   */
  async upload(
    fileMetadata: IUploadedFileMetadata,
    perRequestOptions: Partial<IGCloudStoragePerRequestOptions> = null
  ): Promise<string> {
    // générer un UUID pour éviter les collisions de fichiers
    const filename = uuid();

    // si des options sont définies, alors surcharger/enrichir
    perRequestOptions = {
      ...this.options,
      ...perRequestOptions,
    };

    // construction du nom du fichier (si un prefix est défini)
    let gcFilename =
      perRequestOptions && perRequestOptions.prefix
        ? perRequestOptions.prefix + filename
        : filename;

    // ajout du 'baseUri' si celui-ci est défini
    gcFilename = perRequestOptions.storageBaseUri
      ? [perRequestOptions.storageBaseUri, gcFilename].join('/')
      : gcFilename;

    // creer l'objet 'file' sur le bucket
    const gcFile = this.bucket.file(gcFilename);

    const writeStreamOptions =
      perRequestOptions && perRequestOptions.writeStreamOptions;

    // définir les autorisations (ACL)
    const { predefinedAcl = 'publicRead' } = perRequestOptions;
    const streamOpts: CreateWriteStreamOptions = {
      predefinedAcl: predefinedAcl,
      ...writeStreamOptions,
    };

    // définir le 'Content-Type'
    const contentType = fileMetadata.mimetype;
    if (contentType) {
      streamOpts.metadata = { contentType };
    }

    // démarrer le processus d'upload du fichier
    return new Promise((resolve, reject) => {
      gcFile
        .createWriteStream(streamOpts)
        .on('error', (error) => reject(error))
        .on('finish', () =>
          // succès d'enregistrement du fichier sur GCloud Storage, retourner l'URL du fichier créé
          resolve(this.getStorageUrl(gcFilename, perRequestOptions))
        )
        .end(fileMetadata.buffer);
    });
  }

  /**
   * Déterminer l'URL du d'accès du fichier sur GCloud Storage
   *
   * @private
   * @param {string} filename
   * @param {Partial<IGCloudStoragePerRequestOptions>} [perRequestOptions=null]
   * @returns
   * @memberof GCloudStorageService
   */
  private getStorageUrl(
    filename: string,
    perRequestOptions: Partial<IGCloudStoragePerRequestOptions> = null
  ): string {
    // tableau des URIs
    const uris = [
      GCLOUD_STORAGE_BASE_URL,
      perRequestOptions.bucketName,
      filename,
    ];

    // concaténer les URI pour construire l'URL avec en séparateur le '/'
    return uris.join('/');
  }

  /**
   * Download file in bucket on Google Cloud Storage (from storage URL)
   *
   * @param {string} url
   * @returns
   * @memberof GCloudStorageService
   */
  async download(url: string) {
    const domainIndex = url.indexOf(GCLOUD_STORAGE_DOMAIN);
    if (domainIndex !== -1) {
      const _att = url.split(GCLOUD_STORAGE_DOMAIN);
      _att.shift();
      const fileUrlAtt = _att.pop().split('/');
      fileUrlAtt.shift();
      const bucketName = fileUrlAtt.shift();
      const fileUri = fileUrlAtt.join('/');
      console.log(bucketName, fileUri);
      const bucket = this.storage.bucket(bucketName);
      const file = bucket.file(fileUri);

      const [fileMetadata] = await file.getMetadata();
      const fileBuffers = await file.download();
      return {
        fileMetadata,
        fileBuffers,
      };
    }
  }
}
