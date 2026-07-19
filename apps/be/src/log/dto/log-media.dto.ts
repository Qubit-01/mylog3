import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsNumber,
  IsOptional,
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
  @ApiPropertyOptional({
    type: String,
    format: 'date-time',
    description: '媒体拍摄时刻（ISO 8601 UTC 字符串）',
    example: '2026-07-19T06:30:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  takenAt?: string;

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
    type: LogMediaMetadataDto,
    description: '从媒体文件中解析并归一化的元数据',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => LogMediaMetadataDto)
  metadata?: LogMediaMetadataDto;
}
