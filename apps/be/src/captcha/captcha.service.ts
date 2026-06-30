import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import svgCaptcha from 'svg-captcha';

/** 验证码有效期（毫秒） */
const TTL_MS = 5 * 60 * 1000;

/** 内存 store 的一条记录 */
interface CaptchaRecord {
  /** 答案（小写后存储，比对时也转小写） */
  code: string;
  /** 失效时间戳 */
  expireAt: number;
}

/**
 * 图形验证码服务
 * - generate(): 给前端拉一张
 * - verify(): 给业务模块校验，一次性，校验后立即删除
 * - 默认内存存储，多实例部署时换 Redis 实现
 */
@Injectable()
export class CaptchaService {
  /** 内存 store：id → record */
  private readonly store = new Map<string, CaptchaRecord>();

  /** 生成一张验证码 */
  generate() {
    const { text, data } = svgCaptcha.create({
      size: 4, // 字符数
      noise: 2, // 干扰线数量
      color: true,
      ignoreChars: '0o1iIl', // 排除易混字符
    });
    const id = randomUUID();
    this.store.set(id, {
      code: text.toLowerCase(),
      expireAt: Date.now() + TTL_MS,
    });
    this.gc(); // 顺手清一下过期项
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
    const record = this.store.get(id);
    if (!record) return false;
    this.store.delete(id); // 不论对错都删，防重放和暴力枚举
    if (record.expireAt < Date.now()) return false;
    return record.code === input.trim().toLowerCase();
  }

  /** 清理过期项，避免 Map 无限膨胀 */
  private gc() {
    const now = Date.now();
    for (const [id, record] of this.store) {
      if (record.expireAt < now) this.store.delete(id);
    }
  }
}
