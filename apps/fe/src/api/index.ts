import { ElMessage, ElNotification } from 'element-plus'
import createClient from 'openapi-fetch'
import type { components, paths } from './schema'

/** OpenAPI 类型化 client，走 vite 代理 /api → be */
const api = createClient<paths>({ baseUrl: '/api' })

/** 与后端 `AllExceptionsFilter` 契约保持一致（ValidationPipe 会返回 `string[]`） */
interface ApiError {
  statusCode: number
  name: string
  message: string | string[]
  stack?: string
}

/** 官方推荐的副作用扩展点：所有非 2xx 响应统一提示；带 `X-Silent` 头的请求跳过 */
api.use({
  async onResponse({ request, response }) {
    if (response.ok) return
    if (request.headers.get('X-Silent')) return
    const e = (await response
      .clone()
      .json()
      .catch(() => ({}))) as Partial<ApiError>
    const msg = Array.isArray(e.message)
      ? e.message.join('\n')
      : (e.message ?? response.statusText)
    /** 4xx 视为预期业务错误，轻量 ElMessage；5xx / 未知错误才用 Notification 展示详情 */
    if (response.status >= 400 && response.status < 500) {
      ElMessage.error(msg)
      return
    }
    ElNotification.error({
      title: `${e.statusCode ?? response.status} ${e.name ?? 'Error'}`,
      message: import.meta.env.DEV && e.stack ? `${msg}\n\n${e.stack}` : msg,
    })
  },
})

/** 从 paths 里挑出 POST 接口的请求体类型 */
type Body<P extends keyof paths> = paths[P] extends {
  post: { requestBody: { content: { 'application/json': infer T } } }
}
  ? T
  : never

/** 拆包 `{ data, error }`：成功返 data，失败抛出（Notification 由 middleware 负责） */
const unwrap = async <T>(
  p: Promise<{ data?: T; error?: unknown }>,
): Promise<T> => {
  const { data, error } = await p
  if (error) throw error
  return data as T
}

/* ─── auth ─────────────────────────────────────────── */

/** 注册账号，注册即登录（token 已写入 httpOnly cookie） */
export const register = (payload: Body<'/auth/register'>) =>
  unwrap(api.POST('/auth/register', { body: payload }))

/** 登录，token 写入 httpOnly cookie */
export const login = (payload: Body<'/auth/login'>) =>
  unwrap(api.POST('/auth/login', { body: payload }))

/** 登出，清除认证 cookie */
export const logout = () => unwrap(api.POST('/auth/logout', {}))

/* ─── user ─────────────────────────────────────────── */

/** 当前登录用户类型，从后端 OpenAPI schema 派生 */
export type User = components['schemas']['PublicUserDto']

/** 拉当前登录用户；未登录返 401，静默处理不弹全局错误 */
export const getMe = () =>
  unwrap(api.GET('/user/me', { headers: { 'X-Silent': '1' } }))

/* ─── captcha ──────────────────────────────────────── */

/** 拉取一张一次性图形验证码 */
export const createCaptcha = () => unwrap(api.POST('/captcha/create', {}))

/* ─── log ──────────────────────────────────────────── */

/** 单条 Log 的完整类型，从后端 OpenAPI schema 派生，全项目统一使用这个 */
export type Log = components['schemas']['LogDto']

/** 公开 Log 列表（无需登录），按 createdAt 倒序，skip/take 分页 */
export const listPublicLogs = (payload: Body<'/log/list-public'> = {}) =>
  unwrap(api.POST('/log/list-public', { body: payload }))

/** 我的 Log 列表（需登录），按 createdAt 倒序，skip/take 分页 */
export const listMineLogs = (payload: Body<'/log/list-mine'> = {}) =>
  unwrap(api.POST('/log/list-mine', { body: payload }))
