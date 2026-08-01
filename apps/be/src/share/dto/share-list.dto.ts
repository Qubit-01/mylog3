import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { LogListDto } from '../../log/dto/log-list.dto';

/** 分享 Log 列表请求体：加密分享凭证 + 通用游标分页 */
export class ShareListDto extends LogListDto {
  @ApiProperty({ type: String, description: '创建分享时返回的加密凭证' })
  @IsString()
  token!: string;
}
