import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { LogScope } from '../../../generated/prisma/enums.js';

/**
 * 创建 Log 请求体
 * - 未传的字段走服务端默认值（数组默认 `[]`，extra 默认 `{}`，scope 默认 PRIVATE）
 */
export class CreateLogDto {
  @ApiPropertyOptional({
    enum: LogScope,
    description: '可见范围，默认 PRIVATE',
    example: LogScope.PRIVATE,
  })
  @IsOptional()
  @IsEnum(LogScope)
  scope?: LogScope;

  @ApiProperty({
    type: String,
    format: 'date-time',
    description: '记录时间（ISO 字符串），内容对应的真实发生时间',
  })
  @IsDateString()
  logAt!: string;

  @ApiPropertyOptional({ type: String, description: '正文文本' })
  @IsOptional()
  @IsString()
  text?: string;

  @ApiPropertyOptional({
    type: Object,
    isArray: true,
    description: '图片 + 视频列表',
  })
  @IsOptional()
  @IsArray()
  medias?: unknown[];

  @ApiPropertyOptional({ type: Object, isArray: true, description: '音频列表' })
  @IsOptional()
  @IsArray()
  audios?: unknown[];

  @ApiPropertyOptional({ type: Object, isArray: true, description: '文件列表' })
  @IsOptional()
  @IsArray()
  files?: unknown[];

  @ApiPropertyOptional({ type: String, isArray: true, description: '标签列表' })
  @IsOptional()
  @IsArray()
  tags?: string[];

  @ApiPropertyOptional({
    type: Object,
    isArray: true,
    description: '位置坐标列表',
  })
  @IsOptional()
  @IsArray()
  location?: unknown[];

  @ApiPropertyOptional({
    type: Object,
    isArray: true,
    description: '关联人员列表',
  })
  @IsOptional()
  @IsArray()
  people?: unknown[];

  @ApiPropertyOptional({ type: Object, description: '附加信息' })
  @IsOptional()
  @IsObject()
  extra?: Record<string, unknown>;
}
