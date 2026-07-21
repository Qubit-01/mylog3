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

## 图片预览策略

日志编辑器优先通过 `parseImageThumbnail` 读取 EXIF 内嵌缩略图；缩略图缺失或结构无效时，再回退到 `compressImagePreview` 重新压缩原图。

使用 4 张 `4096 × 3072` 的 MVIMG JPEG 实测，`compressImagePreview` 参数为最大 `0.5 MB`、最长边 `512 px`、初始质量 `0.85`：

| 方案 | 输出尺寸 | 平均体积 | 单张耗时 | PSNR |
| --- | --- | ---: | ---: | ---: |
| EXIF 内嵌缩略图 | `320 × 240` | `14.0 KiB` | `0.3–3.6 ms` | `20.93–24.25 dB` |
| 重新压缩预览 | `512 × 384` | `64.3 KiB` | 预热后 `64.5–68.8 ms`，首次 `139.7 ms` | `29.64–32.93 dB` |

内嵌缩略图总体比重新压缩预览小约 `78.3%`，且不需要解码和重新编码原图；重新压缩预览的优势是分辨率更高、细节更清晰。因此当前优先使用内嵌缩略图，以文件体积和处理速度为主要目标，同时保留重新压缩作为兜底。

该结果只代表本组样本，不同设备写入的 EXIF 缩略图尺寸和质量可能不同。

## 部署

如果不走 CDN 加载静态资源，可以不传CDN，把 vite.config 里面的 base 配置注释掉

1. `pnpm build` 先打包
2. `assets/` 及静态资源传 COS(`cos.mylog.ink`) 的 `/assets/`，Header 加 `Cache-Control: public, max-age=31536000, immutable`
3. `index.html` 传服务器 nginx（`/var/www/mylog/fe/`）：`scp dist/index.html <user>@mylog.ink:/var/www/mylog/fe/`
