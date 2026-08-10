import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

/** 发起 QQ OAuth 授权的请求体 */
export class QqStartDto {
  @ApiPropertyOptional({
    type: String,
    description: '登录成功后的站内回跳地址',
  })
  @IsOptional()
  @IsString()
  redirect?: string;
}

/** QQ OAuth 授权地址 */
export class QqStartResponseDto {
  @ApiProperty({ type: String, description: 'QQ OAuth 授权地址' })
  url!: string;
}

/** QQ OAuth 回调参数；已有待处理身份时允许为空以支持刷新恢复 */
export class QqCallbackDto {
  @ApiPropertyOptional({ type: String, description: 'QQ 返回的一次性授权码' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  code?: string;

  @ApiPropertyOptional({ type: String, description: 'QQ 原样返回的 CSRF 状态' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  state?: string;
}

/** QQ 未绑定本站账号时展示给用户的资料 */
export class QqProfileDto {
  @ApiProperty({ type: String, description: 'QQ 昵称' })
  nickname!: string;

  @ApiProperty({ type: String, nullable: true, description: 'QQ 头像地址' })
  avatar!: string | null;
}

/** QQ OAuth 回调处理结果 */
export class QqCallbackResponseDto {
  @ApiProperty({ type: String, description: '本站登录完成后的回跳地址' })
  redirect!: string;

  @ApiProperty({
    type: QqProfileDto,
    nullable: true,
    description: '未绑定时的 QQ 资料；已登录时为 null',
  })
  profile!: QqProfileDto | null;
}
