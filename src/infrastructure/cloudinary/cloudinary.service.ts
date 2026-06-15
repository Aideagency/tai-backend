// src/infrastructure/cloudinary/cloudinary.service.ts
import { Inject, Injectable } from '@nestjs/common';
import { v2 as Cloudinary } from 'cloudinary';
import { Readable } from 'stream';

@Injectable()
export class CloudinaryService {
  constructor(
    @Inject('CLOUDINARY')
    private readonly cloudinary: typeof Cloudinary,
  ) {}

  /**
   * Upload file (image or PDF)
   */
  async uploadFile(
    file: Express.Multer.File,
    options?: {
      folder?: string;
      publicId?: string;
      resourceType?: 'image' | 'raw' | 'video';
    },
  ) {
    if (!file) return null;

    const resourceType =
      options?.resourceType ??
      (file.mimetype.startsWith('image/')
        ? 'image'
        : file.mimetype.startsWith('video/')
          ? 'video'
          : 'raw');

    return new Promise<{
      url: string;
      publicId: string;
      resourceType: string;
    }>((resolve, reject) => {
      const uploadStream = this.cloudinary.uploader.upload_stream(
        {
          folder: options?.folder,
          public_id: options?.publicId,
          resource_type: resourceType,
        },
        (error, result) => {
          if (error) return reject(error);

          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            resourceType: result.resource_type,
          });
        },
      );

      Readable.from(file.buffer).pipe(uploadStream);
    });
  }

  /**
   * Delete file from Cloudinary
   */
  async deleteFile(
    publicId: string,
    resourceType: 'image' | 'raw' | 'video' = 'image',
  ) {
    if (!publicId) return;

    return this.cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
  }
}
