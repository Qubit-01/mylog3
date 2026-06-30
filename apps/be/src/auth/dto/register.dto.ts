import { IsString, Length, MinLength } from 'class-validator';

/**
 * 注册请求体（最简版）：用户名 + 密码 + 图形验证码
 */
export class RegisterDto {
  /** 用户昵称，全局唯一 */
  @IsString()
  @Length(2, 20, { message: '昵称长度需在 2-20 之间' })
  name!: string;

  /** 登录密码，明文传入，后端 hash 后入库 */
  @IsString()
  @MinLength(8, { message: '密码至少 8 位' })
  pswd!: string;

  /** 图形验证码 id（/captcha/create 返回的 id） */
  @IsString()
  captchaId!: string;

  /** 图形验证码用户输入 */
  @IsString()
  @Length(4, 4, { message: '验证码为 4 位' })
  captcha!: string;
}
