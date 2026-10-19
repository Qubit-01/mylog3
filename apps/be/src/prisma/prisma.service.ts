import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import {
  PrismaClient as RawPrismaClient,
  type Prisma,
} from '../../generated/prisma/client.js';

/**
 * 生成的 PrismaClient 因 @ts-nocheck 退化为 any，这里手动声明业务用到的最小门面
 * - 数据库模型扩展或新增 delegate 时，补到 PrismaFacade 上
 */

/** QQ 绑定资料；只有 unionid 必填，其余字段保留 QQ 用户资料接口的原始值 */
export interface QqUnion {
  /** QQ 用户跨已打通应用的唯一标识 */
  unionid: string;
  /** 用户资料接口返回码，0 表示成功 */
  ret?: number;
  /** 用户资料接口返回信息 */
  msg?: string;
  /** QQ 空间昵称 */
  nickname?: string;
  /** 30 × 30 的 QQ 空间头像地址 */
  figureurl?: string;
  /** 50 × 50 的 QQ 空间头像地址 */
  figureurl_1?: string;
  /** 100 × 100 的 QQ 空间头像地址 */
  figureurl_2?: string;
  /** 40 × 40 的 QQ 头像地址 */
  figureurl_qq_1?: string;
  /** 100 × 100 的 QQ 头像地址 */
  figureurl_qq_2?: string;
  /** QQ 返回的性别 */
  gender?: string;
}

/** 微信绑定资料；只有 unionid 必填，其余字段允许保存微信接口返回的原始 JSON 数据 */
export interface WeixinUnion extends Prisma.JsonObject {
  /** 微信用户在同一开放平台账号下的唯一标识 */
  unionid: string;
}

/** Auth 行类型 */
export interface AuthRow {
  id: number;
  pswd: string | null;
  email: string | null;
  phone: string | null;
  /** QQ 绑定资料；null 表示未绑定 */
  unionQq: QqUnion | null;
  /** 微信绑定资料；null 表示未绑定 */
  unionWeixin: WeixinUnion | null;
  updatedAt: Date;
  createdAt: Date;
}

/** Auth 写入类型；JSON 列用 Prisma.DbNull 写入 SQL NULL，读取时仍返回 null */
type AuthData = Omit<Partial<AuthRow>, 'unionQq' | 'unionWeixin'> & {
  /** QQ 绑定资料；Prisma.DbNull 表示解绑 */
  unionQq?: QqUnion | typeof Prisma.DbNull;
  /** 微信绑定资料；Prisma.DbNull 表示解绑 */
  unionWeixin?: WeixinUnion | typeof Prisma.DbNull;
};

/** User 行类型 */
export interface UserRow {
  id: number;
  authId: number;
  name: string;
  avatar: string | null;
  data: unknown;
  settings: unknown;
  updatedAt: Date;
  createdAt: Date;
}

/** Log 行类型 */
export interface LogRow {
  id: number;
  userId: number;
  scope: 'PRIVATE' | 'PUBLIC';
  logAt: Date;
  text: string;
  medias: unknown;
  audios: unknown;
  files: unknown;
  tags: unknown;
  location: unknown;
  people: unknown;
  extra: unknown;
  updatedAt: Date;
  createdAt: Date;
}

/** Share 行类型 */
export interface ShareRow {
  id: number;
  userId: number;
  where: unknown;
  updatedAt: Date;
  createdAt: Date;
}

/** 通用 delegate 类型（参数与返回类型尽量宽松，避免 Prisma 内部类型噪音） */
interface Delegate<TRow, TData = Partial<TRow>> {
  findUnique(args: {
    where: Partial<TRow> | Record<string, unknown>;
    select?: unknown;
    include?: unknown;
  }): Promise<TRow | null>;
  findFirst(args: unknown): Promise<(TRow & Record<string, unknown>) | null>;
  findMany(args?: unknown): Promise<TRow[]>;
  count(args?: unknown): Promise<number>;
  create(args: {
    data: TData;
    select?: unknown;
    include?: unknown;
  }): Promise<TRow>;
  update(args: {
    where: Partial<TRow> | Record<string, unknown>;
    data: TData;
  }): Promise<TRow>;
  delete(args: {
    where: Partial<TRow> | Record<string, unknown>;
  }): Promise<TRow>;
  updateMany(args: {
    where: Partial<TRow> | Record<string, unknown>;
    data: TData;
  }): Promise<{ count: number }>;
  deleteMany(args: { where: Partial<TRow> }): Promise<{ count: number }>;
}

/** 事务客户端 / 普通客户端共用的 delegate 门面 */
export interface PrismaTx {
  auth: Delegate<AuthRow, AuthData>;
  user: Delegate<UserRow>;
  log: Delegate<LogRow>;
  share: Delegate<ShareRow>;
}

/** PrismaService 对外暴露的形态 */
export interface PrismaFacade extends PrismaTx {
  $connect(): Promise<void>;
  $disconnect(): Promise<void>;
  $transaction<T>(fn: (tx: PrismaTx) => Promise<T>): Promise<T>;
}

/**
 * 全局 Prisma 服务
 * - 通过 NestJS DI 注入，避免散落 import 单例
 * - 内部仍是真实 PrismaClient 实例，通过断言暴露受控类型
 */
@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  /** 真实 PrismaClient 实例（运行时） */
  private readonly client: PrismaFacade;

  constructor() {
    const adapter = new PrismaMariaDb(process.env.DATABASE_URL!);
    // 生成的 PrismaClient 因 @ts-nocheck 退化为 any 构造，这里断言为 PrismaFacade
    const Ctor = RawPrismaClient as unknown as new (
      options?: ConstructorParameters<typeof RawPrismaClient>[0],
    ) => PrismaFacade;
    this.client = new Ctor({ adapter });
  }

  /** auth delegate */
  get auth() {
    return this.client.auth;
  }

  /** user delegate */
  get user() {
    return this.client.user;
  }

  /** log delegate */
  get log() {
    return this.client.log;
  }

  /** share delegate */
  get share() {
    return this.client.share;
  }

  /** 事务包裹器 */
  $transaction<T>(fn: (tx: PrismaTx) => Promise<T>) {
    return this.client.$transaction(fn);
  }

  /** Nest 启动时连接数据库 */
  async onModuleInit() {
    await this.client.$connect();
  }

  /** Nest 销毁时断开连接 */
  async onModuleDestroy() {
    await this.client.$disconnect();
  }
}
