import { ConflictException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';

/** bcrypt salt rounds */
const SALT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 注册：事务内创建 auth + 默认 user
   * - 当前仅用 name + 密码，auth 表的 email/phone 留空
   * - name 唯一性由数据库 unique 约束兜底
   * @returns 新建用户的公开信息
   */
  async register(dto: RegisterDto) {
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
      // Prisma 唯一冲突：P2002（这里只可能是 user.name）
      if ((e as { code?: string }).code === 'P2002') {
        throw new ConflictException('昵称已被占用');
      }
      throw e;
    }
  }
}
