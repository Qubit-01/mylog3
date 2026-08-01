import { Injectable, NotFoundException } from '@nestjs/common';
import type { LogWhereInput } from '../../generated/prisma/models/Log.js';
import { decrypt, encrypt } from '../common/crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateShareDto, ShareTokenDto } from './dto/create-share.dto';
import { ShareListDto } from './dto/share-list.dto';
import { LogListResultDto } from '../log/dto/log-list.dto';
import { LogDto } from '../log/dto/log.dto';

@Injectable()
export class ShareService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 创建分享：动态模式保存持续条件，固定模式先固化全部匹配 Log ID。
   * @returns 仅返回可公开传递的加密分享凭证
   */
  async create(userId: number, dto: CreateShareDto): Promise<ShareTokenDto> {
    // 1. 创建阶段把内容所有权写进完整 where，读取阶段才能兼容未来其他用户贡献 Log。
    const ownerWhere: LogWhereInput = { ...dto.where, userId };
    let where = ownerWhere;

    if (!dto.dynamic) {
      // 1.1 固定模式由后端读取全部匹配 ID，不依赖前端已加载页数。
      const logs = await this.prisma.log.findMany({
        where: ownerWhere,
        select: { id: true },
      });
      where = { id: { in: logs.map(({ id }) => id) } };
    }

    // 2. where 生成成功后创建分享记录；开关仅用于创建阶段，无须持久化。
    const share = await this.prisma.share.create({
      data: { userId, where },
    });

    // 3. 加密 shareId，防止分享凭证被猜测或篡改。
    return { token: encrypt(String(share.id)) };
  }

  /**
   * 匿名读取分享列表：解密凭证定位分享，并执行服务端持久化的完整 where。
   * @returns 当前页 Log 与下一页游标；分享凭证无效时统一返回不存在
   */
  async list(dto: ShareListDto): Promise<LogListResultDto> {
    let shareId: number;
    try {
      shareId = Number(decrypt(dto.token));
      if (!Number.isSafeInteger(shareId) || shareId < 1) {
        throw new Error('分享 id 错误');
      }
    } catch {
      throw new NotFoundException('分享不存在');
    }

    // 2. userId 只表示分享管理者；内容边界已经完整编码在 share.where 中。
    const share = await this.prisma.share.findUnique({
      where: { id: shareId },
    });
    if (!share) throw new NotFoundException('分享不存在');

    // 3. 两种创建模式统一执行 where，并沿用“我的 Log”分页顺序。
    const items = await this.prisma.log.findMany({
      where: share.where as LogWhereInput,
      orderBy: [{ logAt: 'desc' }, { id: 'desc' }],
      take: 40,
      ...(dto.cursor && { cursor: { id: dto.cursor }, skip: 1 }),
    });
    return {
      items: items as LogDto[],
      cursor: items.at(-1)?.id ?? null,
    };
  }
}
