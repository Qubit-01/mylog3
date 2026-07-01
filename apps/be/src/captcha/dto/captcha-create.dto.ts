import { ApiProperty } from '@nestjs/swagger';

/** 生成图形验证码的返回结构 */
export class CaptchaCreateDto {
  @ApiProperty({
    type: String,
    description: '验证码 id，提交业务接口时回传',
    example: 'uuid-xxx',
  })
  id!: string;

  @ApiProperty({
    type: String,
    description: 'SVG 文本，前端 v-html 或转 dataURL 直接用',
  })
  svg!: string;
}
