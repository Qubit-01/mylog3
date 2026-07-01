import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { CaptchaService } from '../captcha/captcha.service';
import { PrismaService } from '../prisma/prisma.service';
import { PublicUserDto } from '../user/dto/public-user.dto';
import { RegisterDto } from './dto/register.dto';

/** bcrypt salt rounds */
const SALT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly captcha: CaptchaService,
  ) {}

  /**
   * 注册：先校验图形验证码，再在事务内创建 auth + 默认 user
   * - name 唯一性由数据库 unique 约束兜底
   * - 验证码一次性，无论本接口是否成功，captchaId 都已在 verify 时失效
   * @returns 新建用户的公开信息（PublicUserDto）
   */
  async register(dto: RegisterDto): Promise<PublicUserDto> {
    if (!this.captcha.verify(dto.captchaId, dto.captcha)) {
      throw new BadRequestException('验证码错误或已失效');
    }

    const pswd = await bcrypt.hash(dto.pswd, SALT_ROUNDS);
    try {
      return await this.prisma.$transaction(async (tx) => {
        const auth = await tx.auth.create({ data: { pswd } });
        const user = await tx.user.create({
          data: { auth_id: auth.id, name: dto.name },
        });
        return { id: user.id, name: user.name, avatar: user.avatar };
      });
    } catch (e) {
      if ((e as { code?: string }).code === 'P2002') {
        throw new ConflictException('昵称已被占用');
      }
      throw e;
    }
  }
}
