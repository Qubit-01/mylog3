import { defineStore } from 'pinia'
import { getMe, type User } from '../api'

/**
 * 当前登录用户状态
 * - `user` 为 undefined 表示未登录（或尚未探测完）
 * - `fetchMe` 幂等：多次并发调用共享同一次请求
 */
export const useUserStore = defineStore('user', () => {
  /** 当前用户，undefined = 未登录 */
  const user = ref<User>()
  /** 是否已登录 */
  const logged = computed(() => !!user.value)

  /** 首次探测 Promise 缓存，做并发去重 */
  let pending: Promise<void>
  /** 拉取当前用户，幂等：多次调用共享同一次请求；401 静默清空 */
  const fetchMe = () =>
    (pending ??= getMe()
      .then((u) => void (user.value = u))
      .catch(() => void (user.value = undefined)))

  return {
    /** 当前登录用户，undefined 表示未登录 */
    user,
    /** 是否已登录 */
    logged,
    /** 探测当前登录态；重复调用共享同一次请求 */
    fetchMe,
  }
})
