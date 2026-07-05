import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

/** Log 资源基础 DTO */
export class LogResourceDto {
  @ApiProperty({ type: String, description: '资源类型' })
  @IsString()
  type!: string;

  @ApiProperty({ type: String, description: '资源地址或文件名' })
  @IsString()
  url!: string;
}
