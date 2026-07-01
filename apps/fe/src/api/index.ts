import createClient from 'openapi-fetch'
import type { paths } from './schema'

/**
 * OpenAPI 类型化 client —— 全局唯一实例
 * - baseUrl 走 vite dev 代理转 be 的 /api 前缀
 * - 路径 / body / response 均由 schema.d.ts 强约束
 */
const api = createClient<paths>({ baseUrl: '/api' })

/** 从 paths 里挑出 POST 接口的请求体类型 */
type Body<P extends keyof paths> = paths[P] extends {
  post: { requestBody: { content: { 'application/json': infer T } } }
}
  ? T
  : never

/** 把 `{ data, error }` 拆包成"成功返 data、失败抛 error"的常规异步函数语义 */
const unwrap = async <T>(p: Promise<{ data?: T; error?: unknown }>): Promise<T> => {
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
