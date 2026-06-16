import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);
  private readonly s3: S3Client;
  private readonly bucket: string;

  constructor(private readonly config: ConfigService) {
    this.s3 = new S3Client({
      region: this.config.get('app.aws.region') || 'us-east-1',
      credentials: {
        accessKeyId: this.config.get('app.aws.accessKeyId') || '',
        secretAccessKey: this.config.get('app.aws.secretAccessKey') || '',
      },
    });
    this.bucket = this.config.get('app.aws.s3Bucket') || '';
  }

  async uploadFile(buffer: Buffer, key: string, mimetype: string): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: buffer,
      ContentType: mimetype,
    });

    await this.s3.send(command);
    this.logger.log(`File uploaded to S3: ${key}`);
    return this.getFileUrl(key);
  }

  async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    await this.s3.send(command);
    this.logger.log(`File deleted from S3: ${key}`);
  }

  async getSignedUrl(key: string, expiresIn = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    return getSignedUrl(this.s3, command, { expiresIn });
  }

  getFileUrl(key: string): string {
    return `https://${this.bucket}.s3.${this.config.get('app.aws.region') || 'us-east-1'}.amazonaws.com/${key}`;
  }

  parseKeyFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname.slice(1);
    } catch {
      return url;
    }
  }
}
