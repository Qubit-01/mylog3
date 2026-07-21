# AGENTS

本仓库协作约定如下。

> 本文档主要写给以后的 agent 看，只记需要被反复提醒、容易踩坑的约束；一次性的配置、显而易见的常识不写。
>
> 任何 agent 在协作过程中，如果发现值得提醒后来者的踩坑点、隐性约定或反复确认过的偏好，应主动补进本文档；务必保持简洁，不冗余、不堆砌常识。

## 工作流

- 动手写需求前，先查阅相关技术栈的官方文档、推荐用法和最佳实践，优先采用官方推荐方案，避免凭直觉自造轮子。
- 提方案时不推荐短期过渡或凑合方案；默认优先长期可维护的官方推荐方案，并参考市面优秀成熟项目的最佳实践。
- 默认直接在当前分支与工作区修改。
- 除非用户明确要求，否则禁止执行任何会改变 Git 状态的操作，包括暂存、取消暂存、提交、切换或创建分支等；只允许使用 `git status`、`git diff` 等只读命令查看改动。
- 默认不为需求创建 `docs` 设计/方案/计划文档，也不新增 `*.spec.ts` 测试文件；只有用户明确要求时才创建。

## JavaScript / TypeScript

- 没有特殊需求，尽量用箭头函数。只有在更适合方法语义、函数提升、或框架约束时，再用 `function`。
- 必须写文档注释，至少说明用途、核心返回值和关键状态语义，优先在 `return` 里的每个导出字段写就近文档注释，保证使用时悬浮变量能直接看到说明。
- 多阶段流程用 `1.`、`1.1` 分级简洁注释；子流程沿用父级编号（如 `2.2.1`）。
- Swagger DTO 字段已有 `description` 时，不额外写内容重复的 JSDoc。
- 复用次数少于 3 次不要抽常量 / 函数 / 变量，直接内联，避免过度抽象。

## 前端

- 项目中已经安装了 `vueuse` `dayjs` `element-plus` `lodash-unified` `pinia` 等库。
- 尽量不要自己手写代码，用现有的工具。
- 组件如果没有特殊需求，尽量保持单根节点。
- 组件根节点的 `class` 名默认与组件名一致，且大小写保持一致。
- 只有在确实有结构、语义、插槽、过渡或框架限制时，才打破单根节点或根节点类名约定。
- 前端已配自动导入，先确认再手动 import；生成的 `components.d.ts` / `auto-imports.d.ts` 需提交。
- 强耦合组件命名体现宿主语义，避免技术分组名和过泛名称。
- 组件级说明写在单文件最顶部，用 `<!-- ... -->` HTML 注释块，别塞进 `<script>` 头部。
- 组件级说明以 `组件名：` 开头，用 `-` 简洁分点说明功能点和注意点。

- 只能使用 flex 布局，禁止使用其他布局，如 grid。
- 居中优先用 flex，不用 `margin` 等来定位。
- 样式类名保持简洁、偏结构语义化，避免“平铺式 BEM/工具化命名”
- 不要把父子层级、区块归属、状态关系硬编码进类名；避免使用 `Block__element`、`Block--modifier` 这类命名。
- 除组件根节点外，子节点类名优先用最短、最直接的语义词，例如 `meta`、`item`。
- 选择器优先依赖组件根节点下的结构关系表达层级，例如 `> .item > .label`，不要依赖冗长类名表达 DOM 结构。
- 三方组件优先用公开 props / class，不依赖内部类名。
- SCSS 优先按结构嵌套书写，从根节点往下展开。
- 样式先表达布局结构，再补局部视觉。
- 色值优先用十六进制；优先用 `#0009` 这种简写，允许轻微透明度损失。
- 做前端改动时，优先保持实现克制，先把基础交互和结构做好，不要堆无用的 DOM、样式或动画。
- 默认不额外实现面向辅助工具或键盘操作的专用无障碍适配，如 `aria-label`、额外键盘事件；只有用户明确要求时再做，原生组件自带的能力不刻意移除。

### Vue Router 5.x（官方文件式路由）

- 路由直接从 `vue-router/auto-routes` 拿 `routes`，禁止手写 `routes` 数组。
- 新增页面只在 `src/pages/` 下加文件，遵循官方命名（`index.vue`、`[id].vue` 等），不要建 `layouts/`、不要写 `XxxPage.vue` 这种名字。
- 多个页面共享布局用路由分组：`(group).vue` 作为布局父，`(group)/*.vue` 作为子页面，URL 不含 `group`；不共享布局的页面直接放 `pages/` 根下。
- `typed-router.d.ts` 由插件自动生成，禁止手改，但需提交。

## 后端

- 不用 Restful 风格
- 没有特殊需求的话，尽量都用 POST 接口
- 接口路径全部小写 + `kebab-case`（如 `/log/list-public`），禁止 camelCase / snake_case，避免代理归一化陷阱
- 数据库表名与列名保持和 Prisma schema 一致（PascalCase model → PascalCase 表；camelCase field → camelCase 列），不用 `@@map` / `@map`
- JSON 列不加 `@default(dbgenerated(...))`（MySQL 上 Prisma 不生成 SQL 默认值），业务层 `create` 时显式传 `{}`

### 日志与异常

- 日志走 `nestjs-pino`，bootstrap 严格按官方顺序：`bufferLogs: true` → `app.useLogger(app.get(Logger))` → `useGlobalInterceptors(new LoggerErrorInterceptor())`。业务里用 `new Logger(XxxService.name)` 即可，`req.id` / `X-Request-ID` 自动串联。
- 全局异常兜底走 `AllExceptionsFilter`，契约字段 `statusCode / name / message / stack`（可能附 Nest 原生的 `error`、ValidationPipe 的 `message: string[]`）。`Error` 的 `name/message/stack` 是不可枚举属性，必须手工提取，不能直接 `JSON.stringify`。
- 业务只 `throw new BadRequestException('xxx')` / `NotFoundException` 等语义化异常，filter 自动映射状态码。不要在 controller 里手动 `res.status().json()`。

### 前后端类型契约（OpenAPI + codegen）

- **单一源**：后端 DTO class 是唯一契约来源，`@ApiProperty` 描述形状、`class-validator` 管运行时校验。
- **响应 DTO** 必须是 class（interface 无运行时反射），controller 用 `@ApiCreatedResponse({ type: XxxDto })`。
- **`tsx`/esbuild 不 emit decorator metadata**：`@ApiProperty` 必须显式 `type: String`/`Number`；POST body 必须 `@ApiBody({ type: XxxDto })`。
- **`@ApiPropertyOptional` 禁止写 `default`**：`default` 是服务端实现细节，不属于契约。写了会让 `openapi-typescript`（默认 `--default-non-nullable true`）把可选字段生成为必填。默认值只放在 service 层 `?? 兜底` 里。
- **生成流程**：be 侧 `pnpm gen:openapi`（会连库）→ 产 `apps/be/openapi.json` → fe 侧 `pnpm gen:api` → 产 `apps/fe/src/api/schema.d.ts`。两个文件都提交 git。
- **fe 请求**：只走 `apps/fe/src/api/index.ts` 的 `api` 实例（openapi-fetch），path 字面量即类型索引，禁止手写 request/response interface。
- **副作用挂 middleware**：Notification、请求日志、token 注入、loading 等一律走 `api.use({ onRequest / onResponse })`，业务函数只 `unwrap`，不允许在业务代码里散落弹窗或错误处理。

## 工程

- pnpm monorepo + catalog 管理依赖版本：版本只写在 `pnpm-workspace.yaml` 的 `catalog`，子包用 `"xxx": "catalog:"` 引用。
- 跨包复用：放 `packages/shared/src/composables/<Name>/`，每个文件夹一个 `index.ts` 入口。文件夹按"主产物"命名 —— 组件大驼峰（`LiquidGlass/`），逻辑短横线（`use-xxx/`、`markdown/`）。禁建 `components/` 等平行目录。
- 跨包共享组件用显式 `import`，不挂 `unplugin-vue-components` resolver。

## 其他

- 注释、错误提示、commit 信息等都用中文。
- 严禁以简洁、优化、重构为由删改原有注释（JSDoc、行内说明、被注释掉的候选配置、TODO 等）；仅在明显失效时才可改写，且需说明原因。
- 优先考虑代码简洁，逻辑优雅且合理。
- 鼓励随时重构之前的代码逻辑，使系统更简洁优雅。
- 多去网络中寻找现成的成熟的解决方案，可以直接抄过来用，尽量不要自己写。
- 让 agent 在项目中拥有尽量完整的可观测性和可操作性，比如日志记录。
- 尽量不要自己写代码，有现成的成熟的工具就用，保证项目代码简洁，比如 dayjs。
- 不要因为需求小就直接自己实现，不要想着走捷径。
