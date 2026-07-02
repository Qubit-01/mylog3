import { defineStore } from 'pinia'
import { getMe } from '../api'
import type { components } from '../api/schema'

type PublicUser = components['schemas']['PublicUserDto']

/**
 * 当前登录用户状态
 * - `user` 为 undefined 表示未登录（或尚未探测完）
 * - `ready` 表示首次探测已结束，供路由/页面判断加载态
 */
export const useUserStore = defineStore('user', () => {
  /** 当前用户，undefined = 未登录 */
  const user = ref<PublicUser>()
  /** 首次 fetchMe 是否已完成 */
  const ready = ref(false)

  /** 是否已登录 */
  const isLoggedIn = computed(() => !!user.value)

  /** 拉取当前用户，401 静默清空；应用启动时调用一次 */
  const fetchMe = async () => {
    try {
      user.value = await getMe()
    } catch {
      user.value = undefined
    } finally {
      ready.value = true
    }
  }

  return {
    /** 当前登录用户，undefined 表示未登录 */
    user,
    /** 首次探测是否已完成，未完成时 UI 可显示 loading */
    ready,
    /** 是否已登录 */
    isLoggedIn,
    /** 探测当前登录态；启动时调用一次 */
    fetchMe,
  }
})
