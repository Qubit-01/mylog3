import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import { LogResourceDto } from './log-resource.dto';

/** Log 文件 DTO */
export class LogFileDto extends LogResourceDto {
  @ApiProperty({
    type: String,
    enum: ['file'],
    description: '文件类型',
    example: 'file',
  })
  @IsIn(['file'])
  declare type: 'file';
}
