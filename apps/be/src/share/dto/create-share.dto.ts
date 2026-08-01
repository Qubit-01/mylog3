import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsObject, IsOptional } from 'class-validator';
import type { LogWhereInput } from '../../../generated/prisma/models/Log.js';

/** 创建 Log 分享请求体 */
export class CreateShareDto {
  @ApiPropertyOptional({
    type: Boolean,
    description: '是否动态分享；不传或 false 时固定当前全部匹配 Log ID',
  })
  @IsOptional()
  @IsBoolean()
  dynamic?: boolean;

  @ApiPropertyOptional({
    type: Object,
    additionalProperties: true,
    description: '当前完整 Prisma LogWhereInput 筛选条件',
  })
  @IsOptional()
  @IsObject()
  where?: LogWhereInput;
}

/** 创建 Log 分享响应 */
export class ShareTokenDto {
  @ApiProperty({ type: String, description: '加密 Share id 得到的分享凭证' })
  token!: string;
}
