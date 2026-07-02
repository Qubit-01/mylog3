# be

mylog3 后端：NestJS 11 + Prisma 7（MySQL/MariaDB）。默认端口 **20914**。

## 启动

前置：Node ≥ 22、pnpm ≥ 10、一个可连的 MySQL/MariaDB。

```bash
cd apps/be

# 1) 生成 Prisma Client（必跑，产物 generated/** 不入 git）
npx prisma generate

# 2) 启动
pnpm dev              # nest start --watch，端口 20914
```

探活：`GET http://localhost:20914/hello`。

> 切分支 / schema 变更后必须重跑 `npx prisma generate`，否则启动直接报找不到 `generated/prisma/client.js`。

## 环境变量

`apps/be/.env` 不入 git，需手动创建：

```dotenv
# 数据库
DATABASE_URL=mysql://<user>:<pswd>@<host>:<port>/<db>

# JWT
SecretKey=<jwt 签名密钥>

# 腾讯云 COS（上传相关，不用可留空）
CosSecretId=
CosSecretKey=
CosBucket=
CosRegion=
CosDurationSeconds=

# DeepSeek（不用可留空）
DeepseekApiKey=
```

## 脚本

- `pnpm dev` — watch 模式启动
- `pnpm build` / `pnpm start:prod` — 构建 / 生产模式
- `pnpm gen:openapi` — 生成 `openapi.json`，供 fe 侧 `pnpm gen:api` 消费
- `npx prisma migrate dev` — 生成并应用迁移

## 前后端类型契约（改 DTO 后必跑）

后端 DTO 是唯一契约来源，任何 `@ApiProperty` / `class-validator` 装饰器变动，都要按下面两步重新生成前端类型：

```bash
# 1) be 侧：DTO → apps/be/openapi.json
cd apps/be && pnpm gen:openapi

# 2) fe 侧：openapi.json → apps/fe/src/api/schema.d.ts
cd apps/fe && pnpm gen:api
```

两个产物（`be/openapi.json`、`fe/src/api/schema.d.ts`）都要提交 git。

## 模块 & 接口

所有路由**默认公开**，需要登录的接口打 `@Auth()`（方法或类均可）。响应/错误结构统一由 `AllExceptionsFilter` 兜底：`{ statusCode, name, message, stack? }`。

### `auth` — 登录态管理

- `POST /auth/register`
  - body: `RegisterDto { name, pswd, captchaId, captcha }`
  - resp: `204`
  - 校验验证码 → 事务创建 `Auth + User` → Set-Cookie(`token`)
- `POST /auth/login`
  - body: `LoginDto { name, pswd }`
  - resp: `204`
  - bcrypt 比对 → Set-Cookie(`token`)
- `POST /auth/logout`
  - resp: `204`
  - 幂等清 cookie，未登录调用也不报错

Token payload：`{ sub: user.id }`，`.env.SecretKey` 签发，默认 60d。
Cookie 配置：`httpOnly + sameSite=lax + path=/`，生产带 `secure`，`maxAge` 60d。

### `user` — 用户数据

- `GET /user/me` — `@Auth`
  - resp: `PublicUserDto`
  - 前端启动 / 刷新时探测登录态，未登录返回 401

### `captcha` — 图形验证码

- `POST /captcha/create`
  - resp: `CaptchaCreateDto { id, svg }`
  - 生成一次性 SVG 验证码，5 分钟过期，一次校验后失效

### 通用 DTO

- `PublicUserDto` — `{ id: number, name: string, avatar: string | null }`
- `RegisterDto` — `{ name (2-20), pswd (>=8), captchaId, captcha }`
- `LoginDto` — `{ name, pswd }`，只 `@IsString()`，错误统一"账号或密码错误"
- `CaptchaCreateDto` — `{ id: string, svg: string }`

### 健康检查（`AppController`，非模块）

- `GET /hello` — 打印 body 并回显，用于快速探活
- `POST /hello` — 同上 POST 版本

## 约定

- 全局 `ValidationPipe`：`whitelist + transform`，DTO 未声明字段自动剔除
- 全局 `AuthGuard`（`APP_GUARD`）：默认公开，`@Auth()` 声明需要登录
- 基础设施模块无 HTTP 接口：`prisma`（全局 `PrismaService`，`@prisma/adapter-mariadb`）、`logger`（`nestjs-pino`）、`common`（`AllExceptionsFilter`）
- 全部走 POST，非 RESTful，见根 `AGENTS.md`
- 前后端类型契约单源：DTO class + `@ApiProperty` → `openapi.json` → fe 的 `schema.d.ts`
- `generated/**` 是 Prisma 产物，不入 git

## 待跟进 TODO

- **Prisma 7 类型门面**：当前 `src/prisma/prisma.service.ts` 没有用官方教科书式的 `extends PrismaClient` Recipe，而是组合 + 手写 `AuthRow` / `UserRow` / `Delegate` 类型门面。原因是 Prisma 7 生成的 `generated/prisma/**` 全部带 `@ts-nocheck`，继承会让 `PrismaClient` 退化成 `any`。等 Prisma 移除 `@ts-nocheck`（已知问题，社区跟进中），改回 `extends PrismaClient`，删掉手写门面。**新增表时记得同步更新门面。**
