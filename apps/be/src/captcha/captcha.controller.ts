import { Controller, Post } from '@nestjs/common';
import { CaptchaService } from './captcha.service';

@Controller('captcha')
export class CaptchaController {
  constructor(private readonly captcha: CaptchaService) {}

  /** 生成图形验证码 */
  @Post('create')
  create() {
    return this.captcha.generate();
  }
}
