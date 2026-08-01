import { useShareStore } from '@/stores/share'
import type { Component } from 'vue'
import type { RouteLocationAsPath } from 'vue-router'
import Index from './index.vue'
import Mine from './mine.vue'
import MapPage from './map.vue'
import Profile from './profile.vue'
import Share from './share.vue'

/** 默认布局中的单个 Tab 配置 */
export interface Tab {
  /** RouterLink 跳转目标 */
  to: RouteLocationAsPath
  /** TabBar 展示名称 */
  label: string
  /** Swiper 中挂载的页面组件 */
  component: Component
}

/** 始终展示的主 Tab */
const mainTabs: Tab[] = [
  { to: { path: '/' }, label: '首页', component: Index },
  { to: { path: '/mine' }, label: '我的', component: Mine },
  { to: { path: '/map' }, label: '地图', component: MapPage },
  { to: { path: '/profile' }, label: '个人', component: Profile },
]

/** TabBar 与 Swiper 共享的当前可见 Tab 列表 */
export const useTabs = () => {
  const route = useRoute()
  const share = useShareStore()

  /** 当前可见的 Tab 列表 */
  const tabs = computed<Tab[]>(() => [
    ...mainTabs,
    ...(share.token || route.path === '/share'
      ? [
          {
            to: { path: '/share', query: { token: share.token } },
            label: '分享',
            component: Share,
          },
        ]
      : []),
  ])
  /** 当前路由对应的 Tab 索引；附属页位于列表之后 */
  const index = computed(() => {
    const i = tabs.value.findIndex(({ to }) => to.path === route.path)
    return i < 0 ? tabs.value.length : i
  })

  return {
    /** 当前可见的 Tab 列表 */
    tabs,
    /** 当前路由对应的 Tab 索引 */
    index,
  }
}
