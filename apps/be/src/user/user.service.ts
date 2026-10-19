import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PublicUserDto } from './dto/public-user.dto';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  /** 根据 id 拉用户全部信息，不存在则 404 */
  async findPublicById(id: number): Promise<PublicUserDto> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('用户不存在');

    // QQ 绑定属于 Auth，同一认证下的多个用户档案共享绑定；公开接口只返回状态和展示资料。
    const auth = await this.prisma.auth.findUnique({
      where: { id: user.authId },
      select: { unionQq: true },
    });
    const qq = auth?.unionQq;
    return {
      ...user,
      /** 所属认证账号的 QQ 绑定状态 */
      qqBound: Boolean(qq?.unionid),
      /** QQ 原始昵称缺失或空白时省略，不使用本站昵称作为占位 */
      qqNickname: qq?.nickname?.trim() || undefined,
      /** 优先使用大尺寸 QQ 头像，缺失时尝试小尺寸；仅转换展示地址的协议 */
      qqAvatar: (
        qq?.figureurl_qq_2?.trim() || qq?.figureurl_qq_1?.trim()
      )?.replace(/^http:/, 'https:'),
    } as PublicUserDto;
  }
}
