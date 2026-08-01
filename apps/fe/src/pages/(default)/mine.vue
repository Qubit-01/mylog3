<!--
我的：
- 新增 Log，并按筛选条件展示当前用户的时间线。
- 支持将当前自定义筛选创建为固定或动态分享，并复制公开链接。
- 滚动到底部自动加载下一页。
-->
<script lang="ts" setup>
import { createShare, type Log, type Where } from '@/api'
import LogCard from '@/components/LogCard.vue'
import LogEditor from '@/components/LogEditor.vue'
import LogFilter from '@/components/LogFilter.vue'
import { useLogList } from '@/stores/log'
import { Share } from '@element-plus/icons-vue'
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

/** 分享确认框是否显示 */
const shareVisible = ref(false)
/** 是否创建随筛选结果变化的动态分享；默认 false 即固定当前列表 */
const dynamicShare = ref(false)
/** 创建分享与复制链接是否正在执行 */
const sharing = ref(false)
const { copy } = useClipboard({ legacy: true })

/** 每次打开确认框都恢复为默认的固定分享 */
const openShare = () => {
  dynamicShare.value = false
  shareVisible.value = true
}

/** 创建当前筛选分享，成功后复制完整公开链接并关闭确认框 */
const submitShare = async () => {
  if (sharing.value) return
  sharing.value = true
  try {
    const { token } = await createShare({
      dynamic: dynamicShare.value,
      where: where.value,
    })
    const url = new URL('/share', window.location.origin)
    url.searchParams.set('token', token)
    await copy(url.href)
    shareVisible.value = false
    ElMessage.success('分享链接已复制')
  } finally {
    sharing.value = false
  }
}

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
    <div class="toolbar">
      <ElSegmented
        v-model="whereId"
        :options="[
          { label: '全部', value: 0 },
          { label: '筛选', value: -1 },
        ]"
      />
      <ElButton
        v-if="whereId === -1"
        :icon="Share"
        type="primary"
        plain
        circle
        @click="openShare"
      />
    </div>
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

    <ElDialog
      v-model="shareVisible"
      title="分享当前筛选"
      width="min(420px, calc(100% - 32px))"
      align-center
      append-to-body
    >
      <ElSwitch
        v-model="dynamicShare"
        active-text="动态分享"
        inactive-text="固定分享"
      />
      <template #footer>
        <ElButton :disabled="sharing" @click="shareVisible = false">
          取消
        </ElButton>
        <ElButton type="primary" :loading="sharing" @click="submitShare">
          创建并复制链接
        </ElButton>
      </template>
    </ElDialog>
  </ElScrollbar>
</template>

<style lang="scss" scoped>
.mine {
  :deep(> .wrap > .view > .toolbar) {
    align-self: stretch;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;

    > .el-segmented {
      --el-border-radius-base: 16px;
      box-shadow: 0 2px 8px #0001;
    }
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
