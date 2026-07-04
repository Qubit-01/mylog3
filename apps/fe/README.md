# fe

mylog3 前端：Vue 3 + `<script setup>` + Vite + TypeScript。

## 启动

```bash
pnpm install
pnpm dev     # vite --host
```

## 脚本

- `pnpm dev` — 本地开发
- `pnpm build` — 构建产物
- `pnpm gen:api` — 从 `apps/be/openapi.json` 生成 `src/api/schema.d.ts`

## 前后端类型契约

前端**不手写请求/响应类型**，全部从后端 DTO 生成。改后端 DTO 后按顺序执行：

```bash
cd apps/be && pnpm gen:openapi   # DTO → openapi.json
cd apps/fe && pnpm gen:api       # openapi.json → schema.d.ts
```

两个产物都要提交 git。请求统一走 `src/api/index.ts` 的 `api` 实例（openapi-fetch），路径字面量即类型索引，禁止手写 interface。

## 部署

`index.html` → 服务器 nginx（`/var/www/mylog/fe/`），静态资源 → 腾讯云 COS + CDN（`cos.mylog.ink`）。

```bash
pnpm build
```

1. `dist/assets/` 传 COS 的 `/assets/`，Header 加 `Cache-Control: public, max-age=31536000, immutable`
2. `dist/index.html` 传服务器：`scp dist/index.html <user>@mylog.ink:/var/www/mylog/fe/`
