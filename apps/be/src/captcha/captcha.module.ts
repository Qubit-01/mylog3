import { Global, Module } from '@nestjs/common';
import { CaptchaController } from './captcha.controller';
import { CaptchaService } from './captcha.service';
import { VerificationCodeService } from './verification-code.service';

/**
 * 图形验证码全局模块：任何业务模块可直接注入 CaptchaService.verify() 使用
 * - VerificationCodeService 由图形和邮箱验证码共享，保持同一份内存状态。
 */
@Global()
@Module({
  controllers: [CaptchaController],
  providers: [CaptchaService, VerificationCodeService],
  exports: [CaptchaService, VerificationCodeService],
})
export class CaptchaModule {}
