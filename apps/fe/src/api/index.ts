import { ElMessage, ElNotification } from 'element-plus'
import createClient from 'openapi-fetch'
import type { Prisma } from 'be/prisma'
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
export const signUp = (payload: Body<'/auth/sign-up'>) =>
  unwrap(api.POST('/auth/sign-up', { body: payload }))

/** 登录，token 写入 httpOnly cookie */
export const signIn = (payload: Body<'/auth/sign-in'>) =>
  unwrap(api.POST('/auth/sign-in', { body: payload }))

/** 使用 QQ Access Token 登录，token 写入 httpOnly cookie */
export const signInQq = (payload: Body<'/auth/qq/sign-in'>) =>
  unwrap(api.POST('/auth/qq/sign-in', { body: payload }))

/** 登出，清除认证 cookie */
export const signOut = () => unwrap(api.POST('/auth/sign-out', {}))

/* ─── user ─────────────────────────────────────────── */

/** 当前登录用户类型，从后端 OpenAPI schema 派生 */
export type User = components['schemas']['PublicUserDto']

/** 拉当前登录用户；未登录返 401，静默处理不弹全局错误 */
export const getMe = () =>
  unwrap(api.GET('/user/me', { headers: { 'X-Silent': '1' } }))

/* ─── captcha ──────────────────────────────────────── */

/** 拉取一张一次性图形验证码 */
export const createCaptcha = () => unwrap(api.POST('/captcha/create', {}))

/* ─── cos ─────────────────────────────────────────── */

/** COS 凭证类型，从后端 OpenAPI schema 派生 */
export type CosCredential = components['schemas']['CosCredentialDto']

/** 获取当前用户目录的 COS 临时凭证 */
export const createCosCredential = () => unwrap(api.POST('/cos/credential', {}))

/** 获取带指定文件名的 COS 短时下载地址 */
export const createCosDownloadUrl = (payload: Body<'/cos/download-url'>) =>
  unwrap(api.POST('/cos/download-url', { body: payload }))

/* ─── log ──────────────────────────────────────────── */

/** 单条 Log 的完整类型，从后端 OpenAPI schema 派生，全项目统一使用这个 */
export type Log = components['schemas']['LogDto']

/** “我的 Log”筛选条件；undefined 表示不筛选 */
export type Where = Prisma.LogWhereInput | undefined

/** 创建 Log 的请求体类型，从后端 OpenAPI schema 派生 */
export type CreateLog = components['schemas']['CreateLogDto']

/** Log 媒体类型，从后端 OpenAPI schema 派生 */
export type LogMedia = components['schemas']['LogMediaDto']

/** Log 音频类型，从后端 OpenAPI schema 派生 */
export type LogAudio = components['schemas']['LogAudioDto']

/** Log 文件类型，从后端 OpenAPI schema 派生 */
export type LogFile = components['schemas']['LogFileDto']

/** 公开 Log 列表（无需登录），按 createdAt 倒序游标分页 */
export const listPublicLogs = (payload: Body<'/log/list-public'> = {}) =>
  unwrap(api.POST('/log/list-public', { body: payload }))

/** 我的 Log 列表（需登录），按 logAt 倒序游标分页 */
export const listMineLogs = (
  payload: Omit<Body<'/log/list-mine'>, 'where'> & {
    /** 完整筛选条件，随 Prisma schema 自动同步 */
    where?: Where
  } = {},
) => unwrap(api.POST('/log/list-mine', { body: payload }))

/** 获取单条 Log；公开记录无需登录，私有记录仅本人可见 */
export const getLog = (payload: Body<'/log/get'>) =>
  unwrap(api.POST('/log/get', { body: payload }))

/** 创建一条 Log（需登录），当前前端先提交正文与发生时间 */
export const createLog = (payload: Body<'/log/create'>) =>
  unwrap(api.POST('/log/create', { body: payload }))

/** 更新一条 Log（仅本人），未来编辑表单复用新增表单时调用 */
export const updateLog = (payload: Body<'/log/update'>) =>
  unwrap(api.POST('/log/update', { body: payload }))

/** 删除指定 Log（仅本人可删），成功时后端返回 204 无正文 */
export const deleteLog = (payload: Body<'/log/delete'>) =>
  unwrap(api.POST('/log/delete', { body: payload }))

/* ─── share ────────────────────────────────────────── */

/** 创建当前 Log 筛选的分享，并返回用于拼接公开链接的加密凭证 */
export const createShare = (
  payload: Omit<Body<'/share/create'>, 'where'> & {
    /** 当前完整 Prisma LogWhereInput；undefined 表示分享全部 Log */
    where?: Where
  },
) => unwrap(api.POST('/share/create', { body: payload }))

/** 匿名分页读取分享中的 Log */
export const listSharedLogs = (payload: Body<'/share/list'>) =>
  unwrap(api.POST('/share/list', { body: payload }))
