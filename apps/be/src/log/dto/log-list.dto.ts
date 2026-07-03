import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

/** Log 列表请求体：仅分页参数，作者由具体接口语义决定 */
export class LogListDto {
  @ApiPropertyOptional({
    type: Number,
    minimum: 0,
    default: 0,
    description: '跳过的条数，默认 0',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  skip?: number;

  @ApiPropertyOptional({
    type: Number,
    minimum: 1,
    maximum: 100,
    default: 20,
    description: '取的条数，默认 20，最大 100',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  take?: number;
}
