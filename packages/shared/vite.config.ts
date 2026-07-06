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
