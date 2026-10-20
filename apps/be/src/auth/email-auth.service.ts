import { createHmac, randomInt } from 'node:crypto';
import {
  BadGatewayException,
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ses } from 'tencentcloud-sdk-nodejs-ses';
import { VerificationCodeService } from '../captcha/verification-code.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  EmailBindDto,
  EmailSendCodeDto,
  EmailSendCodeResultDto,
} from './dto/email.dto';

/**
 * 邮箱绑定：SES 投递、内存限频和一次性验证码校验，始终关联当前 Auth。
 * - 与图形验证码一样使用进程内存，重启后验证码与发送记录清空，仅适用于单进程部署。
 */
@Injectable()
export class EmailAuthService {
  private readonly logger = new Logger(EmailAuthService.name);
  /** auth / email 前缀隔离的限频键 → 最近 24 小时的申请时间戳 */
  private readonly sends = new Map<string, number[]>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly codes: VerificationCodeService,
  ) {}

  /** 发送 6 位验证码；同一账号或邮箱间隔 60 秒，滚动 24 小时最多各 10 次 */
  async sendCode(
    userId: number,
    dto: EmailSendCodeDto,
  ): Promise<EmailSendCodeResultDto> {
    // 1. 所有权来自当前登录身份；邮箱只在验证通过后写入 Auth。
    const auth = await this.prisma.auth.findFirst({
      where: { users: { some: { id: userId } } },
    });
    if (!auth) throw new UnauthorizedException('当前账号不存在');
    if (auth.email) throw new ConflictException('当前账号已绑定邮箱');
    if (await this.prisma.auth.findUnique({ where: { email: dto.email } })) {
      throw new ConflictException('该邮箱已绑定其他账号');
    }

    // 1.1 按需读取配置，未开通邮件服务时不影响其他登录功能和 OpenAPI 生成。
    const secretId = process.env.SES_SECRET_ID;
    const secretKey = process.env.SES_SECRET_KEY;
    const region = process.env.SES_REGION;
    const from = process.env.SES_FROM_EMAIL;
    const templateId = Number(process.env.SES_TEMPLATE_ID);
    const signingKey = process.env.SecretKey;
    if (
      !secretId ||
      !secretKey ||
      !from ||
      !signingKey ||
      !Number.isSafeInteger(templateId) ||
      templateId <= 0 ||
      !['ap-guangzhou', 'ap-hongkong'].includes(region ?? '')
    ) {
      throw new ServiceUnavailableException('邮箱服务未配置，请联系管理员');
    }
    const client = new ses.v20201002.Client({
      credential: { secretId, secretKey },
      region,
      profile: { httpProfile: { reqTimeout: 10 } },
    });
    const code = randomInt(1_000_000).toString().padStart(6, '0');
    // 绑定用途和认证身份参与摘要，内存中也不保留验证码明文。
    const codeHash = createHmac('sha256', signingKey)
      .update(JSON.stringify(['email-bind', auth.id, dto.email, code]))
      .digest('hex');

    // 2. 申请时顺便清理过期发送记录；验证码的过期清理由共享服务处理。
    const now = Date.now();
    for (const [key, times] of this.sends) {
      if ((times.at(-1) ?? 0) <= now - 86_400_000) this.sends.delete(key);
    }
    const histories = ['auth:' + auth.id, 'email:' + dto.email].map((key) => ({
      key,
      times: (this.sends.get(key) ?? []).filter(
        (time) => time > now - 86_400_000,
      ),
    }));
    if (histories.some(({ times }) => (times.at(-1) ?? 0) > now - 60_000)) {
      throw new HttpException(
        '发送过于频繁，请在 60 秒后重试',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    if (histories.some(({ times }) => times.length >= 10)) {
      throw new HttpException(
        '验证码发送次数已达上限，请稍后再试',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    // 2.1 检查与预占之间不 await，保证当前进程的并发申请不能绕过限频。
    for (const { key, times } of histories)
      this.sends.set(key, [...times, now]);
    // 2.2 重新申请即替换旧验证码；失败发送仍占配额，避免错误时无限重发。
    // 以认证账号为键，同一账号只保留最近一次申请；目标邮箱已经参与 HMAC。
    const record = this.codes.create('email-bind:' + auth.id, codeHash, {
      maxAttempts: 5,
      pending: true,
    });

    // 3. 只有 SES 接受后验证码才允许被校验。
    const result = await client
      .SendEmail({
        FromEmailAddress: from,
        Destination: [dto.email],
        Subject: '多元记邮箱绑定验证码',
        Template: {
          TemplateID: templateId,
          TemplateData: JSON.stringify({ code }),
        },
        TriggerType: 1,
      })
      .catch((error: unknown) => {
        // 仅清理本次失败申请，不影响可能已经重新发送的验证码；发送记录继续用于限频。
        record.remove();
        // 不记录 SDK 原始请求或错误正文，避免邮箱、验证码和密钥进入日志。
        const failure = error as { code?: string; requestId?: string };
        this.logger.warn(
          {
            authId: auth.id,
            sesCode: failure.code,
            sesRequestId: failure.requestId,
          },
          '邮箱绑定验证码发送失败',
        );
        throw new BadGatewayException('验证码邮件发送失败，请稍后重试');
      });
    if (!record.activate()) {
      throw new ConflictException('验证码已失效，请重新发送');
    }
    this.logger.log(
      {
        authId: auth.id,
        sesRequestId: result.RequestId,
        sesMessageId: result.MessageId,
      },
      '邮箱绑定验证码已提交 SES',
    );
    return {
      /** 距离下次发送需等待的秒数 */
      retryAfter: 60,
    };
  }

  /** 校验并消费一次验证码，再条件更新邮箱；最多校验 5 次 */
  async bind(userId: number, dto: EmailBindDto): Promise<void> {
    const signingKey = process.env.SecretKey;
    if (!signingKey)
      throw new ServiceUnavailableException('邮箱服务未配置，请联系管理员');

    // 1. 不接收客户端 authId，防止将验证码用于其他账号。
    const auth = await this.prisma.auth.findFirst({
      where: { users: { some: { id: userId } } },
    });
    if (!auth) throw new UnauthorizedException('当前账号不存在');
    if (auth.email) throw new ConflictException('当前账号已绑定邮箱');
    const codeHash = createHmac('sha256', signingKey)
      .update(JSON.stringify(['email-bind', auth.id, dto.email, dto.code]))
      .digest('hex');
    // 2. 同步记次与消费，在写库前删除正确验证码，避免并发重复使用；写库失败时需重新申请。
    if (!this.codes.verify('email-bind:' + auth.id, codeHash))
      throw new BadRequestException('验证码错误、已失效或尝试次数已达上限');
    try {
      const bound = await this.prisma.auth.updateMany({
        where: { id: auth.id, email: null },
        data: { email: dto.email },
      });
      if (!bound.count)
        throw new ConflictException('邮箱绑定状态已变化，请刷新后重试');
    } catch (error) {
      if ((error as { code?: string }).code === 'P2002') {
        throw new ConflictException('该邮箱已绑定其他账号');
      }
      throw error;
    }
  }
}
