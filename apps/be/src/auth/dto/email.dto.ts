import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, Matches, MaxLength } from 'class-validator';

/** 为当前认证账号申请邮箱绑定验证码 */
export class EmailSendCodeDto {
  @ApiProperty({
    type: String,
    format: 'email',
    maxLength: 100,
    description: '待绑定邮箱',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail({}, { message: '请输入有效的邮箱地址' })
  @MaxLength(100, { message: '邮箱地址不能超过 100 个字符' })
  email!: string;
}

/** 校验目标邮箱的验证码并完成当前账号绑定 */
export class EmailBindDto extends EmailSendCodeDto {
  @ApiProperty({
    type: String,
    pattern: '^\\d{6}$',
    description: '收到的 6 位数字验证码',
  })
  @Matches(/^\d{6}$/, { message: '请输入 6 位数字验证码' })
  code!: string;
}

/** 邮件被 SES 接受后返回的重发间隔，单位秒 */
export class EmailSendCodeResultDto {
  @ApiProperty({ type: Number, description: '再次发送前需等待的秒数' })
  retryAfter!: number;
}
