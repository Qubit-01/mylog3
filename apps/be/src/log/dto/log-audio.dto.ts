import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import { LogResourceDto } from './log-resource.dto';

/** Log 音频 DTO */
export class LogAudioDto extends LogResourceDto {
  @ApiProperty({
    type: String,
    enum: ['audio'],
    description: '音频类型',
    example: 'audio',
  })
  @IsIn(['audio'])
  declare type: 'audio';
}
