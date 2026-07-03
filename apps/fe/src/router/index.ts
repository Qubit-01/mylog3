import { createRouter, createWebHistory } from 'vue-router'
import { routes, handleHotUpdate } from 'vue-router/auto-routes'
import { useUserStore } from '../stores/user'

/** 路由实例 */
export const router = createRouter({
  history: createWebHistory(),
  routes,
})

/**
 * 全局登录守卫：读取路由 meta.auth，未登录跳登录页并带 redirect。
 * 首次进入等待 userStore.fetchMe 完成，避免刷新时误判为未登录。
 * meta 由各页面通过 `definePage({ meta: { auth: true } })` 声明。
 */
router.beforeEach(async (to) => {
  if (!to.meta.auth) return
  const userStore = useUserStore()
  await userStore.fetchMe()
  if (userStore.logged) return
  return { path: '/login', query: { redirect: to.fullPath } }
})

// 路由热更新，无需刷新页面
if (import.meta.hot) handleHotUpdate(router)
