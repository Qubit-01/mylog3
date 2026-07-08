import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import VueRouter from 'vue-router/vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import { VueRouterAutoImports } from 'vue-router/unplugin'
import { imagetools } from 'vite-imagetools'

// https://vite.dev/config/
export default defineConfig({
  // 生产环境静态资源走 CDN；index.html 仍由服务器 nginx 托管
  // base: process.env.NODE_ENV === 'production' ? 'https://cos.mylog.ink/' : '/',
  build: {
    cssMinify: 'esbuild',
  },
  plugins: [
    VueRouter(),
    vue(), // ⚠️ Vue 必须放在 VueRouter() 之后
    imagetools({
      defaultDirectives: (url) => {
        if (url.searchParams.get('as') === 'picture') {
          return new URLSearchParams({
            w: '640;1280;1920',
            format: `avif;webp;${url.pathname.split('.').pop()}`,
          })
        }
        return new URLSearchParams()
      },
    }),
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
