import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import VueRouter from 'vue-router/vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import { VueRouterAutoImports } from 'vue-router/unplugin'

// https://vite.dev/config/
export default defineConfig({
  // 生产环境静态资源走 CDN；index.html 仍由服务器 nginx 托管
  // base: process.env.NODE_ENV === 'production' ? 'https://cos.mylog.ink/' : '/',
  plugins: [
    VueRouter(),
    vue(), // ⚠️ Vue 必须放在 VueRouter() 之后
    AutoImport({
      imports: ['vue', VueRouterAutoImports, 'pinia', '@vueuse/core'],
      resolvers: [ElementPlusResolver()],
    }),
    Components({
      resolvers: [ElementPlusResolver()],
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:20914',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
