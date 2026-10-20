import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import svgCaptcha from 'svg-captcha';
import { CaptchaCreateDto } from './dto/captcha-create.dto';
import { VerificationCodeService } from './verification-code.service';

/**
 * 图形验证码服务
 * - generate(): 给前端拉一张
 * - verify(): 给业务模块校验，一次性，校验后立即删除
 * - 默认内存存储，多实例部署时换 Redis 实现
 */
@Injectable()
export class CaptchaService {
  constructor(private readonly codes: VerificationCodeService) {}

  /** 生成一张验证码 */
  generate(): CaptchaCreateDto {
    const { text, data } = svgCaptcha.create({
      size: 4, // 字符数
      noise: 2, // 干扰线数量
      color: true,
      ignoreChars: '0o1iIl', // 排除易混字符
    });
    const id = randomUUID();
    // 答案小写后存储，比对时也转小写；用途前缀隔离图形和邮箱验证码。
    this.codes.create('captcha:' + id, text.toLowerCase());
    return {
      /** 验证码 id，提交业务接口时回传 */
      id,
      /** SVG 文本，前端 v-html 或转 dataURL 直接用 */
      svg: data,
    };
  }

  /**
   * 校验验证码（一次性，命中即删）
   * @returns 是否通过
   */
  verify(id: string, input: string): boolean {
    // 默认仅一次机会，不论对错都删，防重放和暴力枚举。
    return this.codes.verify('captcha:' + id, input.trim().toLowerCase());
  }
}
