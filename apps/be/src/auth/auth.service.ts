import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { CaptchaService } from '../captcha/captcha.service';
import { PrismaService } from '../prisma/prisma.service';
import { SignInDto } from './dto/sign-in.dto';
import { SignUpDto } from './dto/sign-up.dto';

/** bcrypt salt rounds */
const SALT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly captcha: CaptchaService,
    private readonly jwt: JwtService,
  ) {}

  /**
   * 注册：校验验证码 → 事务创建 auth + user → 返回签好的 JWT
   * - name 唯一性由数据库 unique 约束兜底（P2002）
   */
  async signUp(dto: SignUpDto): Promise<string> {
    if (!this.captcha.verify(dto.captchaId, dto.captcha)) {
      throw new BadRequestException('验证码错误或已失效');
    }
    const pswd = await bcrypt.hash(dto.pswd, SALT_ROUNDS);
    try {
      const user = await this.prisma.$transaction(async (tx) => {
        const auth = await tx.auth.create({ data: { pswd } });
        return tx.user.create({
          data: { authId: auth.id, name: dto.name, data: {}, settings: {} },
        });
      });
      return this.jwt.signAsync({ sub: user.id });
    } catch (e) {
      if ((e as { code?: string }).code === 'P2002') {
        throw new ConflictException('昵称已被占用');
      }
      throw e;
    }
  }

  /**
   * 登录：按 name 查 user → bcrypt 比对 → 返回签好的 JWT
   * - 账号 / 密码错误统一提示，避免枚举
   */
  async signIn(dto: SignInDto): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { name: dto.name },
    });
    if (!user) throw new UnauthorizedException('账号或密码错误');
    const auth = await this.prisma.auth.findUnique({
      where: { id: user.authId },
    });
    if (!auth?.pswd || !(await bcrypt.compare(dto.pswd, auth.pswd))) {
      throw new UnauthorizedException('账号或密码错误');
    }
    return this.jwt.signAsync({ sub: user.id });
  }
}
