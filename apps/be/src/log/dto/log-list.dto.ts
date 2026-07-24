import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsObject, IsOptional, Max, Min } from 'class-validator';
import type { LogWhereInput } from '../../../generated/prisma/models/Log.js';

/** 通用 Log 列表请求体：offset 分页参数，作者由具体接口语义决定 */
export class LogListDto {
  @ApiPropertyOptional({
    type: Number,
    minimum: 0,
    description: '跳过的条数，缺省 0',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  skip?: number;

  @ApiPropertyOptional({
    type: Number,
    minimum: 1,
    maximum: 100,
    description: '取的条数，缺省 20，最大 100',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  take?: number;
}

/** 我的 Log 列表请求体：原有 offset 分页 + 完整 Prisma where */
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
