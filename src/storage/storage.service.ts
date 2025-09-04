import { Injectable } from '@nestjs/common';
import {
  S3Client, PutObjectCommand, GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Readable } from 'node:stream';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { extname } from 'node:path';
import { FileRef } from './common/file-ref';

@Injectable()
export class StorageService {
  private readonly s3: S3Client;
  private readonly bucket: string;
  private readonly endpoint: string;
  private readonly region: string;

  constructor(private readonly config: ConfigService) {
    this.bucket   = this.config.get<string>('S3_BUCKET', 'crm-files');
    this.endpoint = this.config.get<string>('S3_ENDPOINT', 'http://minio:9000');
    this.region   = this.config.get<string>('S3_REGION') || 'us-east-1';

    const accessKeyId = this.config.get<string>('S3_ACCESS_KEY');
    const secretAccessKey = this.config.get<string>('S3_SECRET_KEY');

    if (!accessKeyId || !secretAccessKey) {
      throw new Error('S3_ACCESS_KEY and S3_SECRET_KEY must be defined');
    }

    this.s3 = new S3Client({
      region: this.region,
      endpoint: this.endpoint,
      forcePathStyle: true,
      credentials: { accessKeyId, secretAccessKey },
    });
  }

  async uploadAndMakeRef(opts: {
    buffer: Buffer | Readable;
    mime: string;
    originalName: string;
    prefix: string;
    public?: boolean;
    signedTtlSec?: number;
  }): Promise<FileRef> {
    const ext = (extname(opts.originalName) || '').toLowerCase();
    const key = `${opts.prefix}/${randomUUID()}${ext}`;

    await this.s3.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: opts.buffer,
      ContentType: opts.mime,
    }));

    const url = opts.public
      ? this.publicUrl(key)
      : await this.signGetUrl(key, opts.signedTtlSec ?? 300);

    return {
      url,
      key,
      bucket: this.bucket,
      mime: opts.mime,
      name: opts.originalName,
      public: !!opts.public,
      uploadedAt: new Date().toISOString(),
    };
  }

  async refreshUrl(ref: FileRef, ttlSec = 300): Promise<FileRef> {
    if (ref.public) return ref;
    const fresh = await this.signGetUrl(ref.key, ttlSec);
    return { ...ref, url: fresh };
  }

  publicUrl(key: string) {
    const base = this.endpoint.replace(/\/+$/, '');
    return `${base}/${this.bucket}/${encodeURI(key)}`;
  }

  async signGetUrl(key: string, expiresIn: number) {
    const cmd = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    return getSignedUrl(this.s3, cmd, { expiresIn });
  }
}
