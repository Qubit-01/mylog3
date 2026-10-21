# be

mylog3 后端：NestJS 12 + Prisma 7（MySQL/MariaDB）。默认端口 **20914**。

## 启动

前置：Node ≥ 24，pnpm ≥ 10

```bash
cd apps/be

# 1) 生成 Prisma Client（必跑，产物 generated/** 不入 git）
npx prisma db pull && npx prisma generate

# 2) 启动
pnpm dev              # nest start --watch，端口 20914
```

探活：`GET http://localhost:20914/hello`。

> 切分支 / schema 变更后必须重跑 `npx prisma generate`，否则启动直接报找不到 `generated/prisma/client.js`。

## 环境变量

`apps/be/.env` 不入 git，需手动创建：

```bash
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

# 腾讯云 SES（邮箱绑定；密钥仅保存在后端，不与 COS 共用权限）
SES_SECRET_ID=
SES_SECRET_KEY=
SES_REGION=ap-hongkong
SES_FROM_EMAIL="多元记 <account@mylog.ink>"
SES_TEMPLATE_ID=211078

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

## 部署

服务器仓库放 `/opt/mylog3`，进程用 pm2 托管，nginx 反代 `/api/` → `127.0.0.1:20914`。

```bash
cd /opt/mylog3
git pull
pnpm install --frozen-lockfile
cd apps/be
npx prisma generate
pnpm build
pm2 reload ecosystem.config.cjs   # 首次用 start，之后一律 reload 做零宕机
```

`.env` 只在服务器上，`chmod 600`，不入 git。开机自启：`pm2 save && pm2 startup`。

### 邮箱绑定配置

1. 在腾讯云 [CAM 用户列表](https://console.cloud.tencent.com/cam) 创建或选择用于服务端发信的子用户，并创建 API 密钥。将 SecretId / SecretKey 分别填入后端 `.env` 的 `SES_SECRET_ID` / `SES_SECRET_KEY`，不要写入前端或仓库。
2. 子用户只需 `name/ses:SendEmail` 操作权限，资源填写 `*`。该接口是操作级授权，不能通过资源字符串限定发信域名；详见 [SES 权限说明](https://cloud.tencent.com/document/product/598/70009)。
3. SES 地域使用中国香港（`ap-hongkong`），发信地址为 `account@mylog.ink`，模板 `211078` 的变量为 `{{code}}`；修改模板后需等待重新审核通过。
4. 修改 `.env` 后重启后端；生产环境执行 `pm2 reload ecosystem.config.cjs --update-env`。

验证码使用现有 `SecretKey` 做 HMAC，不需要额外的验证码密钥。验证码有效期 5 分钟、每次最多校验 5 次；同一 Auth 或目标邮箱间隔 60 秒，滚动 24 小时最多各申请 10 次，失败发送也占配额。与图形验证码一致，验证码和发送记录保存在当前进程内存中，重启后清空，多实例之间不共享；过期记录在后续发送时清理。校验成功即消费验证码，邮箱写入失败时需重新申请。SES 的 RequestId / MessageId 会写入日志，验证码与目标邮箱不会写入业务日志。

本功能支持已登录账号的邮箱绑定和解绑，解绑后可重新验证并绑定邮箱。已绑定邮箱可搭配现有密码登录，未设置密码的账号仍使用 QQ 登录；邮箱验证码登录和找回密码尚未实现。解绑邮箱不会影响用户名密码登录和 QQ 登录；QQ 解绑仍保留原有的密码校验规则。

## 模块 & 接口

所有路由**默认公开**，需要登录的接口打 `@Auth()`（方法或类均可）。响应/错误结构统一由 `AllExceptionsFilter` 兜底：`{ statusCode, name, message, stack? }`。

### `auth` — 登录态管理

- `POST /auth/sign-up`
  - body: `SignUpDto { name, pswd, captchaId, captcha }`
  - 用户名不能包含 `@`；QQ 注册时将昵称中的 `@` 替换为 `_`，原始 QQ 资料仍保留
  - resp: `204`
  - 校验验证码 → 事务创建 `Auth + User` → Set-Cookie(`token`)
- `POST /auth/sign-in`
  - body: `SignInDto { name, pswd }`，自动识别用户名或已绑定邮箱
  - resp: `204`
  - 输入包含 `@` 时按邮箱查询，否则按用户名查询 → bcrypt 比对 → Set-Cookie(`token`)，错误统一“账号或密码错误”
  - 邮箱先去除两端空白并转小写；用户名登录使用对应档案，邮箱登录与 QQ 登录一致选择最早创建的档案
- `POST /auth/sign-out`
  - resp: `204`
  - 幂等清 cookie，未登录调用也不报错
- `POST /auth/email/send-code` — `@Auth`
  - body: `{ email }`，自动去除两端空白并统一小写
  - resp: `{ retryAfter }`，单位秒
- `POST /auth/email/bind` — `@Auth`
  - body: `{ email, code }`，验证码为 6 位数字字符串
  - resp: `204`，消费正确验证码后条件更新唯一邮箱，禁止覆盖已有绑定
- `POST /auth/email/unbind` — `@Auth`
  - 无请求体，解绑当前认证账号的邮箱；未绑定时直接成功
  - resp: `204`，条件清空邮箱并取消旧的绑定申请，保留现有登录方式

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
- `SignUpDto` — `{ name (2-20), pswd (>=6), captchaId, captcha }`
- `SignInDto` — `{ name, pswd }`，只 `@IsString()`，登录失败统一"账号或密码错误"
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
