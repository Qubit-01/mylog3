import { Injectable, Logger } from '@nestjs/common';
import COS from 'cos-nodejs-sdk-v5';
import * as Sts from 'qcloud-cos-sts';
import { CosCredentialDto } from './dto/cos-credential.dto';
import { CreateDownloadUrlDto, DownloadUrlDto } from './dto/download-url.dto';

/** COS 基础配置，统一从环境变量读取 */
interface CosConfig {
  /** 腾讯云永久密钥 SecretId，只允许保存在服务端 */
  secretId: string;
  /** 腾讯云永久密钥 SecretKey，只允许保存在服务端 */
  secretKey: string;
  /** COS 存储桶名称，格式为 BucketName-APPID */
  bucket: string;
  /** COS 存储桶地域，如 ap-guangzhou */
  region: string;
  /** COS 临时凭证与下载 URL 的有效期，单位秒 */
  durationSeconds: number;
}

/** 腾讯云 COS 服务，负责用户目录上传凭证的统一封装 */
@Injectable()
export class CosService {
  private readonly logger = new Logger(CosService.name);
  private config?: CosConfig;
  private client?: COS;

  /** 创建当前用户目录的 COS 临时凭证，权限仅覆盖 `users/{userId}/` */
  async createCredential(userId: number): Promise<CosCredentialDto> {
    const config = this.getConfig();
    const prefix = `users/${userId}/`;
    const data = await Sts.getCredential({
      secretId: config.secretId,
      secretKey: config.secretKey,
      durationSeconds: config.durationSeconds,
      policy: Sts.getPolicy([
        {
          action: 'name/cos:*',
          bucket: config.bucket,
          region: config.region,
          prefix: `${prefix}*`,
        },
      ]),
    });

    this.logger.debug(`创建 COS 上传凭证：${prefix}`);

    return {
      bucket: config.bucket,
      region: config.region,
      prefix,
      ...data,
    };
  }

  /**
   * 创建带指定文件名的短时下载 URL。
   * @returns 在配置时长内有效、响应为 attachment 的 COS 签名 URL DTO
   */
  createDownloadUrl(dto: CreateDownloadUrlDto): DownloadUrlDto {
    const config = this.getConfig();
    this.client ??= new COS({
      SecretId: config.secretId,
      SecretKey: config.secretKey,
    });

    // response-* 参数必须参与签名；filename* 按 RFC 5987 编码才能稳定支持中文。
    const encodedFilename = encodeURIComponent(dto.filename).replace(
      /[!'()*]/g,
      (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`,
    );

    this.logger.debug(`创建 COS 文件下载地址：${dto.key}`);

    return {
      url: this.client.getObjectUrl({
        Bucket: config.bucket,
        Region: config.region,
        Key: dto.key,
        Sign: true,
        Protocol: 'https:',
        Expires: config.durationSeconds,
        Query: {
          'response-content-disposition': `attachment; filename*=UTF-8''${encodedFilename}`,
        },
      }),
    };
  }

  /** 懒加载并校验 COS 环境变量，避免 OpenAPI 生成等离线任务依赖云端配置 */
  private getConfig(): CosConfig {
    if (this.config) return this.config;

    const secretId = process.env.CosSecretId;
    const secretKey = process.env.CosSecretKey;
    const bucket = process.env.CosBucket;
    const region = process.env.CosRegion;

    if (!secretId || !secretKey || !bucket || !region) {
      throw new Error(
        'COS 配置缺失，请检查 CosSecretId / CosSecretKey / CosBucket / CosRegion',
      );
    }

    this.config = {
      secretId,
      secretKey,
      bucket,
      region,
      durationSeconds: Number(process.env.CosDurationSeconds),
    };

    return this.config;
  }
}
