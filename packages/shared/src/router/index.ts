import { createRouter, createWebHistory } from 'vue-router'
import { routes, handleHotUpdate } from 'vue-router/auto-routes'

/** 路由实例 */
export const router = createRouter({
  history: createWebHistory(),
  routes,
})

// 路由热更新，无需刷新页面
if (import.meta.hot) handleHotUpdate(router)

router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} - 多元记` : '多元记'
})
