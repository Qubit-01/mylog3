import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

/** 媒体内嵌位置坐标 DTO */
export class LogMediaLocationDto {
  @ApiProperty({ type: Number, description: '经度', example: 116.397128 })
  @IsNumber()
  lng!: number;

  @ApiProperty({ type: Number, description: '纬度', example: 39.916527 })
  @IsNumber()
  lat!: number;
}

/** Log 图片 / 视频媒体 DTO */
export class LogMediaDto {
  @ApiProperty({
    type: String,
    enum: ['image', 'video'],
    description: '媒体类型：image 图片 / video 视频，MIME 类型前缀',
    example: 'image',
  })
  @IsIn(['image', 'video'])
  type!: 'image' | 'video';

  @ApiProperty({ type: String, description: '媒体文件地址或文件名' })
  @IsString()
  url!: string;

  @ApiPropertyOptional({
    type: LogMediaLocationDto,
    description: '图片 EXIF 位置坐标',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => LogMediaLocationDto)
  location?: LogMediaLocationDto;
}
