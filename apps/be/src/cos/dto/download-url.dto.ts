import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

/** 创建 COS 下载地址的请求 DTO */
export class CreateDownloadUrlDto {
  @ApiProperty({
    type: String,
    description: 'COS object key',
    example: 'users/1/mylog/files/uuid-report.pdf',
  })
  @IsString()
  @IsNotEmpty()
  key!: string;

  @ApiProperty({
    type: String,
    description: '下载时使用的文件名',
    example: '年度总结.pdf',
  })
  @IsString()
  @IsNotEmpty()
  filename!: string;
}

/** COS 短时下载地址响应 DTO */
export class DownloadUrlDto {
  @ApiProperty({
    type: String,
    description: '包含下载文件名响应参数的 COS 短时签名 URL',
  })
  url!: string;
}
