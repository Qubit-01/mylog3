import { ApiProperty } from '@nestjs/swagger';

/** COS 临时密钥 DTO */
export class CosTemporaryCredentialDto {
  @ApiProperty({ type: String, description: '临时密钥 SecretId' })
  tmpSecretId!: string;

  @ApiProperty({ type: String, description: '临时密钥 SecretKey' })
  tmpSecretKey!: string;

  @ApiProperty({
    type: String,
    description: '临时会话 token，上传时放到 x-cos-security-token',
  })
  sessionToken!: string;
}

/** COS 凭证响应 DTO */
export class CosCredentialDto {
  @ApiProperty({
    type: String,
    description: '存储桶名称，格式为 BucketName-APPID',
  })
  bucket!: string;

  @ApiProperty({ type: String, description: '存储桶地域，如 ap-guangzhou' })
  region!: string;

  @ApiProperty({
    type: String,
    description: '当前用户的对象目录前缀，如 users/1/',
  })
  prefix!: string;

  @ApiProperty({ type: Number, description: '临时密钥开始时间，Unix 秒' })
  startTime!: number;

  @ApiProperty({ type: Number, description: '临时密钥过期时间，Unix 秒' })
  expiredTime!: number;

  @ApiProperty({
    type: CosTemporaryCredentialDto,
    description: '客户端直传使用的临时密钥',
  })
  credentials!: CosTemporaryCredentialDto;
}
