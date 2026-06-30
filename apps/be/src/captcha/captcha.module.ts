import { Global, Module } from '@nestjs/common';
import { CaptchaController } from './captcha.controller';
import { CaptchaService } from './captcha.service';

/**
 * 图形验证码全局模块：任何业务模块可直接注入 CaptchaService.verify() 使用
 */
@Global()
@Module({
  controllers: [CaptchaController],
  providers: [CaptchaService],
  exports: [CaptchaService],
})
export class CaptchaModule {}
