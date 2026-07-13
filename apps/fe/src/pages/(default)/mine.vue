<script lang="ts" setup>
/** 我的：当前用户 Log 竖向列表，滚动到底部自动加载下一页 */
import LogCard from '@/components/LogCard.vue'
import LogEditor from '@/components/LogEditor.vue'
import { useLogList } from '@/stores/log'

definePage({ meta: { auth: true, title: '我的' } })

const { logs, footerText, fetchMore } = useLogList('mine')
</script>

<template>
  <ElScrollbar
    class="mine default-scrollbar"
    wrap-class="wrap"
    view-class="view"
    :distance="80"
    @end-reached="(d) => d === 'bottom' && fetchMore()"
  >
    <LogEditor />
    <LogCard v-for="log in logs" :key="log.id" :log="log" />
    <div v-if="footerText" class="footer">{{ footerText }}</div>
  </ElScrollbar>
</template>

<style lang="scss" scoped>
.mine {
  .footer {
    padding: 16px 0;
    text-align: center;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
}
</style>
