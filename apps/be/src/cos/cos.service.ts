import { Injectable, Logger } from '@nestjs/common';
import * as Sts from 'qcloud-cos-sts';
import { CosUploadCredentialDto } from './dto/cos-upload-credential.dto';

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
  /** 临时密钥有效期，单位秒 */
  durationSeconds: number;
}

/** 腾讯云 COS 服务，负责用户目录上传凭证的统一封装 */
@Injectable()
export class CosService {
  private readonly logger = new Logger(CosService.name);
  private config?: CosConfig;

  /** 创建当前用户目录的直传临时凭证，权限仅覆盖 `users/{userId}/` */
  async createUploadCredential(
    userId: number,
  ): Promise<CosUploadCredentialDto> {
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
