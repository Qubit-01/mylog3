<script setup lang="ts">
/** 应用根组件：启动时探测一次登录态，供全局路由/页面使用 */
import { useUserStore } from './stores/user'

useUserStore().fetchMe()
</script>

<template>
  <RouterView />
</template>
