import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length, MinLength, NotContains } from 'class-validator';

/**
 * 注册请求体 —— 运行时校验 + OpenAPI schema 双重职责
 * 类型契约由 openapi-typescript 从此 class 生成，fe 通过生成的 schema.d.ts 使用
 */
export class SignUpDto {
  @ApiProperty({
    type: String,
    minLength: 2,
    maxLength: 20,
    pattern: '^[^@]+$',
    description: '用户昵称，全局唯一，不能包含 @',
    example: 'alice',
  })
  @IsString()
  @Length(2, 20, { message: '昵称长度需在 2-20 之间' })
  @NotContains('@', { message: '用户名不能包含 @' })
  name!: string;

  @ApiProperty({
    type: String,
    minLength: 6,
    description: '登录密码，明文传入，后端 hash 后入库',
  })
  @IsString()
  @MinLength(6, { message: '密码至少 6 位' })
  pswd!: string;

  @ApiProperty({
    type: String,
    description: '图形验证码 id（/captcha/create 返回的 id）',
  })
  @IsString()
  captchaId!: string;

  @ApiProperty({
    type: String,
    description: '图形验证码用户输入',
  })
  @IsString()
  captcha!: string;
}
