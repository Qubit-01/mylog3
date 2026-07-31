<!--
我的：
- 新增 Log，并按筛选条件展示当前用户的时间线。
- 滚动到底部自动加载下一页。
-->
<script lang="ts" setup>
import type { Log, Where } from '@/api'
import LogCard from '@/components/LogCard.vue'
import LogEditor from '@/components/LogEditor.vue'
import LogFilter from '@/components/LogFilter.vue'
import { useLogList } from '@/stores/log'
import type { TimelineItemProps } from 'element-plus'

interface TimelineEntry extends TimelineItemProps {
  /** 跨分页更新时保持稳定的节点 key */
  key: string
  /** 仅 Log 节点携带的数据，年份与日期节点不设置 */
  log?: Log
}

definePage({ meta: { auth: true, title: '我的' } })

/** 0 是全部，-1 是自定义筛选，正数预留给已保存的筛选 */
const whereId = ref(0)
/** 自定义筛选编辑中的完整 Prisma where */
const where = ref<Where>()
/** 当前实际应用于列表的 where；未选择自定义筛选时不附加条件 */
const activeWhere = computed(() =>
  whereId.value < 0 ? where.value : undefined,
)
const { logs, footerText, loading, fetchMore, refresh } = useLogList(
  'mine',
  activeWhere,
)

/** 将指定 Log ID 直接追加到当前 where 的排除条件 */
const exclude = ({ id }: Log) => {
  const excluded =
    typeof where.value?.id === 'object' ? (where.value.id.notIn ?? []) : []
  if (excluded.includes(id)) return
  where.value = { ...where.value, id: { notIn: [...excluded, id] } }
}

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

  return items
})
</script>

<template>
  <ElScrollbar
    class="mine default-scrollbar"
    wrap-class="wrap"
    view-class="view"
    :distance="720"
    @end-reached="(d) => d === 'bottom' && fetchMore()"
  >
    <LogEditor @done="refresh" />
    <ElSegmented
      v-model="whereId"
      class="toolbar"
      :options="[
        { label: '全部', value: 0 },
        { label: '筛选', value: -1 },
      ]"
      size="small"
    />
    <LogFilter v-show="whereId === -1" v-model="where" :loading />
    <ElTimeline class="timeline">
      <ElTimelineItem
        v-for="{ key, log, ...props } in timelineItems"
        :key="key"
        v-bind="props"
      >
        <LogCard v-if="log" :log="log" hide-meta>
          <template v-if="whereId === -1" #tail="{ log }">
            <ElButton class="exclude" size="small" @click.stop="exclude(log)">
              排除
            </ElButton>
          </template>
        </LogCard>
      </ElTimelineItem>

      <ElTimelineItem
        v-if="footerText"
        :timestamp="footerText"
        placement="top"
      />
    </ElTimeline>
  </ElScrollbar>
</template>

<style lang="scss" scoped>
.mine {
  :deep(> .wrap > .view > .toolbar) {
    align-self: flex-start;
  }

  :deep(> .wrap > .view > .timeline) {
    width: 100%;
    padding-left: 2px;

    > .el-timeline-item {
      padding-bottom: 8px;

      .LogCard > .exclude {
        position: absolute;
        top: 8px;
        right: 8px;
      }
    }
  }
}
</style>
