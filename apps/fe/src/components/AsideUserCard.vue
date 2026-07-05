<script lang="ts" setup>
/** 侧边栏用户卡片：展示当前用户头像与昵称，并提供常用入口 */
import { useUserStore } from '@/stores/user'

const router = useRouter()
/** 当前登录用户；undefined 表示未登录 */
const { user } = storeToRefs(useUserStore())
</script>

<template>
  <div class="AsideUserCard">
    <template v-if="user">
      <ElAvatar :src="user.avatar ?? undefined" :size="56">
        {{ user.name.slice(0, 1) }}
      </ElAvatar>
      <div class="name" @click="router.push('/profile')">
        {{ user.name }}
      </div>
      <ElButton type="primary" round @click="router.push('/mine')">
        去写一篇
      </ElButton>
    </template>
    <template v-else>
      <ElAvatar :size="56">?</ElAvatar>
      <div class="name">未登录</div>
      <ElButton type="primary" round @click="router.push('/login')">
        去登录
      </ElButton>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.AsideUserCard {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);

  > .name {
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;

    &:hover {
      color: var(--el-color-primary);
    }
  }
}
</style>
