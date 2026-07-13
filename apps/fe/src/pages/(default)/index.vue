<script lang="ts" setup>
/** 首页：公开 Log 竖向列表，滚动到底部自动加载下一页 */
import LogCard from '@/components/LogCard.vue'
import { useLogList } from '@/stores/log'

const { logs, footerText, fetchMore } = useLogList('public')
</script>

<template>
  <ElScrollbar
    class="index default-scrollbar"
    wrap-class="wrap"
    view-class="view"
    :distance="80"
    @end-reached="(d) => d === 'bottom' && fetchMore()"
  >
    <LogCard v-for="log in logs" :key="log.id" :log="log" />
    <div v-if="footerText" class="footer">{{ footerText }}</div>
  </ElScrollbar>
</template>

<style lang="scss" scoped>
.index {
  .footer {
    padding: 16px 0;
    text-align: center;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
}
</style>
