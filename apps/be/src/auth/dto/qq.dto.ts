import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

/** 使用前端 QQ SDK 登录或绑定本站账号的请求体 */
export class QqAccessTokenDto {
  @ApiProperty({ type: String, description: 'QQ JS SDK 返回的 Access Token' })
  @IsString()
  @IsNotEmpty()
  accessToken!: string;
}
