import { Injectable } from '@nestjs/common';
import { timingSafeEqual } from 'node:crypto';

/** 验证码有效期（毫秒） */
const TTL_MS = 5 * 60 * 1000;

/** 内存 store 的一条记录 */
interface VerificationCodeRecord {
  /** 用于比对的答案；图形验证码转小写，邮箱验证码使用 HMAC 摘要 */
  code: string;
  /** 失效时间戳 */
  expireAt: number;
  /** 剩余校验次数，成功后立即消费 */
  attempts: number;
  /** 等待邮件投递时禁止校验 */
  pending: boolean;
}

/** 图形与邮箱验证码共用的内存存储；同步校验并消费，仅适用于单进程部署 */
@Injectable()
export class VerificationCodeService {
  /** 内存 store：用途隔离的键 → record */
  private readonly store = new Map<string, VerificationCodeRecord>();

  /** 保存并替换验证码；返回仅作用于本次记录的投递控制方法 */
  create(
    key: string,
    code: string,
    options: {
      /** 最多校验次数，默认一次 */
      maxAttempts?: number;
      /** 是否等待邮件投递成功，默认立即可用 */
      pending?: boolean;
    } = {},
  ) {
    const record: VerificationCodeRecord = {
      code,
      expireAt: Date.now() + TTL_MS,
      attempts: options.maxAttempts ?? 1,
      pending: options.pending ?? false,
    };
    this.store.set(key, record);
    this.gc(); // 顺手清一下过期项
    return {
      /** 投递成功后启用并重新计时；已过期或被重发替换时返回 false */
      activate: (): boolean => {
        if (
          this.store.get(key) !== record ||
          record.expireAt <= Date.now() ||
          !record.pending
        ) {
          return false;
        }
        record.pending = false;
        record.expireAt = Date.now() + TTL_MS;
        return true;
      },
      /** 投递失败时仅删除本次记录，避免误删重发的新验证码 */
      remove: (): void => {
        if (this.store.get(key) === record) this.store.delete(key);
      },
    };
  }

  /** 校验答案；成功或次数耗尽即删除，返回是否通过 */
  verify(key: string, input: string): boolean {
    const record = this.store.get(key);
    if (!record) return false;
    if (record.expireAt <= Date.now()) {
      this.store.delete(key);
      return false;
    }
    if (record.pending) return false;
    const expected = Buffer.from(record.code);
    const actual = Buffer.from(input);
    const matches =
      expected.length === actual.length && timingSafeEqual(expected, actual);
    record.attempts -= 1;
    if (matches || record.attempts <= 0) this.store.delete(key);
    return matches;
  }

  /** 主动取消该用途的验证码，解绑时同时使进行中的申请失效 */
  remove(key: string): void {
    this.store.delete(key);
  }

  /** 清理过期项，避免 Map 无限膨胀 */
  private gc() {
    const now = Date.now();
    for (const [key, record] of this.store) {
      if (record.expireAt <= now) this.store.delete(key);
    }
  }
}
