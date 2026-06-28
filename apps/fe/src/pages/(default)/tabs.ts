import Index from './index.vue'
import Mine from './mine.vue'
import MapPage from './map.vue'
import Profile from './profile.vue'

/**
 * 主 Tab 列表：TabBar 与 Swiper 共享的单一数据源。
 * 新增 Tab：在 `pages/(default)/` 加文件，并在此数组追加一项。
 */
export const tabs = [
  { to: '/', label: '首页', component: Index },
  { to: '/mine', label: '我的', component: Mine },
  { to: '/map', label: '地图', component: MapPage },
  { to: '/profile', label: '个人', component: Profile },
]
