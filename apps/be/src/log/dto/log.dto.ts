import { ApiProperty } from '@nestjs/swagger';
import { LogScope } from '../../../generated/prisma/enums.js';
import { LogMediaDto } from './log-media.dto';

/**
 * Log 响应 DTO —— 覆盖 Log 表全字段
 * class 而非 interface：swagger 需要运行时反射生成 spec
 */
export class LogDto {
  @ApiProperty({ type: Number, description: 'Log 主键 id', example: 1 })
  id!: number;

  @ApiProperty({ type: Number, description: '所属用户 id', example: 1 })
  userId!: number;

  @ApiProperty({
    enum: LogScope,
    description: '可见范围：PRIVATE 仅自己 / PUBLIC 完全公开',
    example: LogScope.PRIVATE,
  })
  scope!: LogScope;

  @ApiProperty({
    type: String,
    format: 'date-time',
    description: '记录时间，内容对应的真实发生时间',
  })
  logAt!: Date;

  @ApiProperty({ type: String, description: '正文文本', example: '' })
  text!: string;

  @ApiProperty({
    type: [LogMediaDto],
    description: '图片 + 视频列表',
    example: [],
  })
  medias!: LogMediaDto[];

  @ApiProperty({
    type: Object,
    isArray: true,
    description: '音频列表，元素 `{ url, duration?, title? }`',
    example: [],
  })
  audios!: unknown[];

  @ApiProperty({
    type: Object,
    isArray: true,
    description: '文件列表，元素 `{ url, name, size?, mime? }`',
    example: [],
  })
  files!: unknown[];

  @ApiProperty({
    type: String,
    isArray: true,
    description: '标签列表',
    example: [],
  })
  tags!: string[];

  @ApiProperty({
    type: Object,
    isArray: true,
    description: '位置坐标列表，元素 `{ lng, lat, name?, address?, time? }`',
    example: [],
  })
  location!: unknown[];

  @ApiProperty({
    type: Object,
    isArray: true,
    description: '关联人员列表，元素 `{ userId?, name?, avatar? }`',
    example: [],
  })
  people!: unknown[];

  @ApiProperty({
    type: Object,
    description: '附加信息，JSON 对象',
    example: {},
  })
  extra!: Record<string, unknown>;

  @ApiProperty({ type: String, format: 'date-time', description: '更新时间' })
  updatedAt!: Date;

  @ApiProperty({
    type: String,
    format: 'date-time',
    description: '创建时间，同时作为对外发送时间',
  })
  createdAt!: Date;
}
