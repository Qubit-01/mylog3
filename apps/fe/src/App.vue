<script setup lang="ts">
/** 应用根组件：启动时探测一次登录态，供全局路由/页面使用 */
import { useUserStore } from './stores/user'

/** 初始化颜色模式，应用系统偏好或已持久化的用户选择 */
useColorMode()
useUserStore().fetchMe()
</script>

<template>
  <RouterView />
</template>
