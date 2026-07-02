import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient as RawPrismaClient } from '../../generated/prisma/client.js';

/**
 * 生成的 PrismaClient 因 @ts-nocheck 退化为 any，这里手动声明业务用到的最小门面
 * - 数据库模型扩展或新增 delegate 时，补到 PrismaFacade 上
 */

/** Auth 行类型 */
export interface AuthRow {
  id: number;
  pswd: string;
  email: string | null;
  phone: string | null;
  unionidQq: string | null;
  unionidWeixin: string | null;
  updatedAt: Date;
  createdAt: Date;
}

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

/** 通用 delegate 类型（参数与返回类型尽量宽松，避免 Prisma 内部类型噪音） */
interface Delegate<TRow> {
  findUnique(args: {
    where: Partial<TRow>;
    select?: unknown;
    include?: unknown;
  }): Promise<TRow | null>;
  findFirst(args: unknown): Promise<(TRow & Record<string, unknown>) | null>;
  create(args: {
    data: Partial<TRow>;
    select?: unknown;
    include?: unknown;
  }): Promise<TRow>;
  update(args: { where: Partial<TRow>; data: Partial<TRow> }): Promise<TRow>;
  delete(args: { where: Partial<TRow> }): Promise<TRow>;
}

/** 事务客户端 / 普通客户端共用的 delegate 门面 */
export interface PrismaTx {
  auth: Delegate<AuthRow>;
  user: Delegate<UserRow>;
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
