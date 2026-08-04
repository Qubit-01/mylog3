<script setup lang="ts">
/** 应用根组件：启动时探测一次登录态，供全局路由/页面使用 */
import { useUserStore } from './stores/user'

/** 是否为 Vite 开发环境；生产构建时会被静态替换为 false */
const isDev = import.meta.env.DEV

/** 初始化颜色模式，应用系统偏好或已持久化的用户选择 */
useColorMode()
useUserStore().fetchMe()
</script>

<template>
  <RouterView />
  <div v-if="isDev" class="env">DEV</div>
</template>

<style lang="scss" scoped>
.env {
  position: fixed;
  top: 4px;
  left: 4px;
  z-index: 999;
  height: 12px;
  padding: 0 4px;
  border-radius: 10px;
  background: #f55a;
  font-size: 8px;
  line-height: 12px;
  pointer-events: none;
}
</style>
