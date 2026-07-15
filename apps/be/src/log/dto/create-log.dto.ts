import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { LogScope } from '../../../generated/prisma/enums.js';
import { LogAudioDto } from './log-audio.dto';
import { LogFileDto } from './log-file.dto';
import { LogMediaDto } from './log-media.dto';

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

  @ApiPropertyOptional({
    type: String,
    format: 'date-time',
    description: '记录时间（ISO 字符串），不传则服务端以当前时间兼底',
  })
  @IsOptional()
  @IsDateString()
  logAt?: string;

  @ApiPropertyOptional({ type: String, description: '正文文本' })
  @IsOptional()
  @IsString()
  text?: string;

  @ApiPropertyOptional({
    type: [LogMediaDto],
    description: '图片 + 视频列表',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LogMediaDto)
  medias?: LogMediaDto[];

  @ApiPropertyOptional({ type: [LogAudioDto], description: '音频列表' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LogAudioDto)
  audios?: LogAudioDto[];

  @ApiPropertyOptional({ type: [LogFileDto], description: '文件列表' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LogFileDto)
  files?: LogFileDto[];

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
