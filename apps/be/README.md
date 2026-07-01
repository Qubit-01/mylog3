# be

mylog3 后端：NestJS 11 + Prisma 7（MySQL/MariaDB）。默认端口 **20914**。

## 启动

```bash
pnpm install
npx prisma generate   # 首次 / 切分支 / schema 变更后必跑，否则报找不到 generated/prisma/client.js
pnpm dev              # nest start --watch
```

需要在 `apps/be/.env` 里配好 `DATABASE_URL`。

## 脚本

- `pnpm dev` — watch 模式启动
- `pnpm build` / `pnpm start:prod` — 构建 / 生产模式
- `pnpm gen:openapi` — 生成 `openapi.json`，供 fe 侧 `pnpm gen:api` 消费
- `npx prisma migrate dev` — 生成并应用迁移

## 模块

- `auth` — 登录 / 注册，`bcrypt` 存密码
- `captcha` — `svg-captcha` 图形验证码
- `user` — 用户信息
- `prisma` — 全局 `PrismaService`，`@prisma/adapter-mariadb` 作为驱动

## 约定

- 全局 `ValidationPipe`：`whitelist + transform`，DTO 未声明字段自动剔除
- 全部走 POST，非 RESTful，见根 `AGENTS.md`
- 前后端类型契约单源：DTO class + `@ApiProperty` → `openapi.json` → fe 的 `schema.d.ts`
- `generated/**` 是 Prisma 产物，不入 git

## 待跟进 TODO

- **Prisma 7 类型门面**：当前 `src/prisma/prisma.service.ts` 没有用官方教科书式的 `extends PrismaClient` Recipe，而是组合 + 手写 `AuthRow` / `UserRow` / `Delegate` 类型门面。原因是 Prisma 7 生成的 `generated/prisma/**` 全部带 `@ts-nocheck`，继承会让 `PrismaClient` 退化成 `any`。等 Prisma 移除 `@ts-nocheck`（已知问题，社区跟进中），改回 `extends PrismaClient`，删掉手写门面。**新增表时记得同步更新门面。**
