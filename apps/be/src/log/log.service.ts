import { Injectable, NotFoundException } from '@nestjs/common';
import { LogScope } from '../../generated/prisma/enums.js';
import { LogRow, PrismaService } from '../prisma/prisma.service';
import { CreateLogDto } from './dto/create-log.dto';
import {
  LogListDto,
  LogListResultDto,
  LogMineListDto,
} from './dto/log-list.dto';
import { LogDto } from './dto/log.dto';
import { UpdateLogDto } from './dto/update-log.dto';

/** Log 列表每页固定返回数量 */
const take = 40;

@Injectable()
export class LogService {
  constructor(private readonly prisma: PrismaService) {}

  /** 创建一条 log，未传的数组 / 对象字段走空值默认 */
  async create(userId: number, dto: CreateLogDto): Promise<LogDto> {
    const data: Partial<LogRow> = {
      userId,
      scope: dto.scope ?? LogScope.PRIVATE,
      logAt: dto.logAt ? new Date(dto.logAt) : new Date(),
      text: dto.text ?? '',
      medias: dto.medias ?? [],
      audios: dto.audios ?? [],
      files: dto.files ?? [],
      tags: dto.tags ?? [],
      location: dto.location ?? [],
      people: dto.people ?? [],
      extra: dto.extra ?? {},
    };
    return (await this.prisma.log.create({ data })) as LogDto;
  }

  /** 公开列表：全部 PUBLIC log，无需登录 */
  async listPublic(dto: LogListDto): Promise<LogListResultDto> {
    const items = await this.prisma.log.findMany({
      where: { scope: LogScope.PUBLIC },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take,
      ...(dto.cursor && { cursor: { id: dto.cursor }, skip: 1 }),
    });
    return {
      items: items as LogDto[],
      cursor: items.at(-1)?.id ?? null,
    };
  }

  /**
   * 我的列表：当前用户的全部 log（PRIVATE + PUBLIC）
   * - 服务端 userId 覆盖客户端同名筛选，确保鉴权边界
   */
  async listMine(
    userId: number,
    dto: LogMineListDto,
  ): Promise<LogListResultDto> {
    const items = await this.prisma.log.findMany({
      where: { ...dto.where, userId },
      orderBy: [{ logAt: 'desc' }, { id: 'desc' }],
      take,
      ...(dto.cursor && { cursor: { id: dto.cursor }, skip: 1 }),
    });
    return {
      items: items as LogDto[],
      cursor: items.at(-1)?.id ?? null,
    };
  }

  /** 获取单条：公开 log 或本人私有 log 可见，鉴权直接写进 where */
  async get(userId: number | undefined, id: number): Promise<LogDto> {
    const log = await this.prisma.log.findFirst({
      where: {
        id,
        OR: [
          { scope: LogScope.PUBLIC },
          ...(userId === undefined ? [] : [{ userId }]),
        ],
      },
    });
    if (!log) throw new NotFoundException('Log 不存在');
    return log as LogDto;
  }

  /** 更新：仅本人可改，复合唯一 `[id, userId]` 一次 DB 搞定鉴权 */
  update(userId: number, dto: UpdateLogDto): Promise<LogDto> {
    const { id, logAt, ...rest } = dto;
    return this.prisma.log
      .update({
        where: { id_userId: { id, userId } },
        data: { ...rest, ...(logAt && { logAt: new Date(logAt) }) },
      })
      .catch((e: { code?: string }) => {
        if (e.code === 'P2025')
          throw new NotFoundException('Log 不存在或无权操作');
        throw e;
      }) as Promise<LogDto>;
  }

  /** 删除：仅本人可删，走 deleteMany 避免 P2025 try/catch */
  async delete(userId: number, id: number): Promise<void> {
    const { count } = await this.prisma.log.deleteMany({
      where: { id, userId },
    });
    if (!count) throw new NotFoundException('Log 不存在或无权操作');
  }
}
