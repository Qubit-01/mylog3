<script lang="ts" setup>
/** 我的：当前用户 Log 竖向列表，滚动到底部自动加载下一页 */
import { useLogList } from '@/composables/useLogList'
import LogCard from '@/components/LogCard.vue'

definePage({ meta: { auth: true, title: '我的' } })

const { logs, footerText, loadMore } = useLogList('mine')
</script>

<template>
  <ElScrollbar
    class="mine"
    wrap-class="wrap"
    view-class="view"
    :distance="80"
    @end-reached="(d) => d === 'bottom' && loadMore()"
  >
    <LogCard v-for="log in logs" :key="log.id" :log="log" />
    <div v-if="footerText" class="footer">{{ footerText }}</div>
  </ElScrollbar>
</template>

<style lang="scss" scoped>
.mine {
  height: 100%;

  :deep(.wrap) {
    display: flex;
    justify-content: center;
    align-items: flex-start;
    overscroll-behavior: contain;
  }

  :deep(.view) {
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 100%;
    max-width: var(--content-max-width);
    padding: 12px;
    // 底部悬浮 TabBar 占位，避免最后一条 log 被挡住
    padding-bottom: calc(env(safe-area-inset-bottom) + 100px);
    transition: max-width 0.3s;
  }

  .footer {
    padding: 16px 0;
    text-align: center;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
}
</style>
