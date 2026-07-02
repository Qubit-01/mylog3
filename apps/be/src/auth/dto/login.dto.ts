import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

/**
 * 登录请求体 —— 只做基本类型校验，不做长度限制（错误提示统一走"账号或密码错误"）
 */
export class LoginDto {
  @ApiProperty({ type: String, description: '用户昵称', example: 'alice' })
  @IsString()
  name!: string;

  @ApiProperty({ type: String, description: '登录密码，明文传入' })
  @IsString()
  pswd!: string;
}
