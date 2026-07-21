<script lang="ts" setup>
/** 我的：当前用户 Log 竖向列表，滚动到底部自动加载下一页 */
import type { Log } from '@/api'
import LogCard from '@/components/LogCard.vue'
import LogEditor from '@/components/LogEditor.vue'
import { useLogList } from '@/stores/log'
import dayjs from 'dayjs'
import type { TimelineItemProps } from 'element-plus'

interface TimelineEntry extends TimelineItemProps {
  /** 跨分页更新时保持稳定的节点 key */
  key: string
  /** 仅 Log 节点携带的数据，年份与日期节点不设置 */
  log?: Log
}

definePage({ meta: { auth: true, title: '我的' } })

const { logs, footerText, fetchMore } = useLogList('mine')

/** 将 Log 列表转换为 Element Plus 可直接渲染的扁平时间线节点 */
const timelineItems = computed<TimelineEntry[]>(() => {
  const items: TimelineEntry[] = []

  for (const [index, log] of logs.value.entries()) {
    const logAt = dayjs(log.logAt)

    if (index === 0 || !logAt.isSame(logs.value[index - 1]?.logAt, 'year')) {
      items.push({
        key: `year-${log.id}`,
        timestamp: logAt.format('YYYY 年'),
        type: 'success',
        size: 'large',
        placement: 'top',
      })
    }

    if (index === 0 || !logAt.isSame(logs.value[index - 1]?.logAt, 'day')) {
      items.push({
        key: `day-${log.id}`,
        timestamp: logAt.format('YYYY-MM-DD'),
        placement: 'top',
      })
    }

    items.push({
      key: `log-${log.id}`,
      log,
      hideTimestamp: true,
      color: 'transparent',
    })
  }

  if (footerText.value) {
    items.push({
      key: 'footer',
      timestamp: footerText.value,
      placement: 'top',
    })
  }

  return items
})
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
    <ElTimeline class="timeline">
      <ElTimelineItem
        v-for="{ key, log, ...props } in timelineItems"
        :key="key"
        v-bind="props"
      >
        <LogCard v-if="log" :log="log" hide-meta />
      </ElTimelineItem>
    </ElTimeline>
  </ElScrollbar>
</template>

<style lang="scss" scoped>
.mine {
  :deep(> .wrap > .view > .timeline) {
    width: 100%;
    padding-left: 2px;

    > .el-timeline-item {
      padding-bottom: 8px;
    }
  }
}
</style>
