import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { LogResourceDto } from './log-resource.dto';

/** 媒体内嵌位置坐标 DTO */
export class LogMediaLocationDto {
  @ApiProperty({ type: Number, description: '经度', example: 116.397128 })
  @IsNumber()
  lng!: number;

  @ApiProperty({ type: Number, description: '纬度', example: 39.916527 })
  @IsNumber()
  lat!: number;
}

/** 媒体文件内嵌元数据 DTO */
export class LogMediaMetadataDto {
  /** 媒体拍摄时刻，统一使用 ISO 8601 UTC 字符串 */
  @ApiPropertyOptional({
    type: String,
    format: 'date-time',
    description: '媒体拍摄时刻（ISO 8601 UTC 字符串）',
    example: '2026-07-19T06:30:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  takenAt?: string;

  /** 媒体拍摄位置坐标 */
  @ApiPropertyOptional({
    type: LogMediaLocationDto,
    description: '媒体拍摄位置坐标',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => LogMediaLocationDto)
  location?: LogMediaLocationDto;
}

/** Log 图片 / 视频媒体 DTO */
export class LogMediaDto extends LogResourceDto {
  @ApiProperty({
    type: String,
    enum: ['image', 'video'],
    description: '媒体类型：image 图片 / video 视频',
    example: 'image',
  })
  @IsIn(['image', 'video'])
  declare type: 'image' | 'video';

  @ApiPropertyOptional({
    type: String,
    description: '用于快速展示的轻量媒体 COS object key；没有时省略',
    example: 'users/1/mylog/preview/uuid-media.jpg',
  })
  @IsOptional()
  @IsString()
  previewUrl?: string;

  /** 从媒体文件中解析并归一化的元数据 */
  @ApiPropertyOptional({
    type: LogMediaMetadataDto,
    description: '从媒体文件中解析并归一化的元数据',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => LogMediaMetadataDto)
  metadata?: LogMediaMetadataDto;
}
