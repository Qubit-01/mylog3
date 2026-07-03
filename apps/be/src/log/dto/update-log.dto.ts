import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';
import { CreateLogDto } from './create-log.dto';

/**
 * 更新 Log 请求体：所有字段可选，只更新传入的
 * - 仅本人可更新自己的 log，userId 由 JWT 推导，无需传入
 */
export class UpdateLogDto extends PartialType(CreateLogDto) {
  @ApiProperty({ type: Number, description: '要更新的 Log id' })
  @IsInt()
  @Min(1)
  id!: number;
}
