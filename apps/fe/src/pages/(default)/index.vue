<script lang="ts" setup>
/** 首页：公开 Log 竖向列表，滚动到底部自动加载下一页 */
import { listPublicLogs } from '@/api'
import { useLogList } from '@/composables/useLogList'
import LogCard from '@/components/LogCard.vue'

const { logs, footerText, loadMore } = useLogList('public', (skip, take) =>
  listPublicLogs({ skip, take }),
)
</script>

<template>
  <ElScrollbar
    class="index"
    view-class="index-view"
    :distance="80"
    @end-reached="(d) => d === 'bottom' && loadMore()"
  >
    <LogCard v-for="log in logs" :key="log.id" :log="log" />
    <div v-if="footerText" class="footer">{{ footerText }}</div>
  </ElScrollbar>
</template>

<style lang="scss" scoped>
.index {
  height: 100%;

  :deep(.index-view) {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 16px;
    // 底部悬浮 TabBar 占位，避免最后一条 log 被挡住
    padding-bottom: calc(env(safe-area-inset-bottom) + 100px);
  }

  .footer {
    padding: 16px 0;
    text-align: center;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
}
</style>
