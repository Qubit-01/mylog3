import { createApp } from 'vue'
import './style.scss'
import App from './App.vue'

import { router } from './router'

import { createPinia } from 'pinia'

import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import 'element-plus/theme-chalk/dark/css-vars.css'
import 'dayjs/locale/zh-cn'
import * as ElementIcons from '@element-plus/icons-vue'

const app = createApp(App)
app.use(router)

const pinia = createPinia()
app.use(pinia)

app.use(ElementPlus, { locale: zhCn })
for (const [k, c] of Object.entries(ElementIcons)) {
  app.component(k, c)
}

app.mount('#app')

/**
 * 新版本发布后，CDN 上旧 chunk 可能被清理，导致老用户懒加载失败
 * Vite 官方推荐：捕获 vite:preloadError，刷新页面拿最新 index.html
 */
window.addEventListener('vite:preloadError', () => {
  window.location.reload()
})