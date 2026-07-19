import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

/** Log 资源基础 DTO */
export class LogResourceDto {
  @ApiProperty({ type: String, description: '资源类型' })
  @IsString()
  type!: string;

  @ApiProperty({
    type: String,
    description: '上传时的原始文件名，用于展示和下载命名',
    example: '年度总结.pdf',
  })
  @IsString()
  name!: string;

  @ApiProperty({
    type: String,
    description: '资源引用：完整 URL 或 COS object key',
  })
  @IsString()
  url!: string;

  @ApiPropertyOptional({
    type: String,
    description: '用于快速展示的轻量资源 COS object key；没有时省略',
    example: 'users/1/mylog/preview/uuid-media.jpg',
  })
  @IsOptional()
  @IsString()
  previewUrl?: string;
}
