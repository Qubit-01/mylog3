import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsObject, IsOptional, Min } from 'class-validator';
import type { LogWhereInput } from '../../../generated/prisma/models/Log.js';
import { LogDto } from './log.dto';

/** Log 列表请求体：页大小由服务端统一控制，客户端只回传游标 */
export class LogListDto {
  @ApiPropertyOptional({
    type: Number,
    minimum: 1,
    description: '上一页返回的游标；首次请求不传',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  cursor?: number;
}

/** 我的 Log 列表请求体：通用游标分页 + 完整 Prisma where */
export class LogMineListDto extends LogListDto {
  @ApiPropertyOptional({
    type: Object,
    additionalProperties: true,
    description: '完整 Prisma LogWhereInput 筛选条件',
  })
  @IsOptional()
  @IsObject()
  where?: LogWhereInput;
}

/** Log 列表分页响应：items 为当前页，cursor 为下一页请求凭据 */
export class LogListResultDto {
  @ApiProperty({ type: [LogDto], description: '当前页的 Log 列表' })
  items!: LogDto[];

  @ApiProperty({
    type: Number,
    nullable: true,
    description: '下一页游标；null 表示没有更多数据',
  })
  cursor!: number | null;
}
