import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

/** 通用 id 请求体（get / delete 复用） */
export class LogIdDto {
  @ApiProperty({ type: Number, description: '目标 Log id' })
  @IsInt()
  @Min(1)
  id!: number;
}
