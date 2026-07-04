<script lang="ts" setup>
/** 我的：当前用户 Log 竖向列表，滚动到底部自动加载下一页 */
import { listMineLogs } from '@/api'
import { useLogList } from '@/composables/useLogList'
import LogCard from '@/components/LogCard.vue'

definePage({ meta: { auth: true, title: '我的' } })

const { logs, footerText, loadMore } = useLogList('mine', (skip, take) =>
  listMineLogs({ skip, take }),
)
</script>

<template>
  <ElScrollbar
    class="mine"
    view-class="mine-view"
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

  :deep(.mine-view) {
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
