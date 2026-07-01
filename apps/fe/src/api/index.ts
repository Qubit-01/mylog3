import { ElNotification } from 'element-plus'
import createClient from 'openapi-fetch'
import type { paths } from './schema'

/** OpenAPI 类型化 client，走 vite 代理 /api → be */
const api = createClient<paths>({ baseUrl: '/api' })

/** 与后端 `AllExceptionsFilter` 契约保持一致（ValidationPipe 会返回 `string[]`） */
interface ApiError {
  statusCode: number
  name: string
  message: string | string[]
  stack?: string
}

/** 官方推荐的副作用扩展点：所有非 2xx 响应统一弹 Notification */
api.use({
  async onResponse({ response }) {
    if (response.ok) return
    const e = (await response
      .clone()
      .json()
      .catch(() => ({}))) as Partial<ApiError>
    const msg = Array.isArray(e.message)
      ? e.message.join('\n')
      : (e.message ?? response.statusText)
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

/** 注册账号，成功返回新用户公开信息 */
export const register = (payload: Body<'/auth/register'>) =>
  unwrap(api.POST('/auth/register', { body: payload }))

/* ─── captcha ──────────────────────────────────────── */

/** 拉取一张一次性图形验证码 */
export const createCaptcha = () => unwrap(api.POST('/captcha/create', {}))
