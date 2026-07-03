<script lang="ts" setup>
/** 首页：公开 Log 竖向列表，滚动到底部自动加载下一页 */
import { listPublicLogs } from '@/api'
import dayjs from 'dayjs'

/** 每页条数 */
const TAKE = 20

const logs = ref<Awaited<ReturnType<typeof listPublicLogs>>>([])
const loading = ref(false)
const noMore = ref(false)

/** 加载下一页；返回条数 < TAKE 视为末页 */
const loadMore = async () => {
  if (loading.value || noMore.value) return
  loading.value = true
  try {
    const rows = await listPublicLogs({ skip: logs.value.length, take: TAKE })
    logs.value.push(...rows)
    noMore.value = rows.length < TAKE
  } finally {
    loading.value = false
  }
}

/** 底部提示语；空串表示不展示 */
const footerText = computed(() => {
  if (loading.value) return '加载中…'
  if (!noMore.value) return ''
  return logs.value.length ? '没有更多了' : '暂无内容'
})

onMounted(loadMore)
</script>

<template>
  <ElScrollbar
    class="index"
    view-class="index-view"
    :distance="80"
    @end-reached="loadMore"
  >
    <article v-for="log in logs" :key="log.id" class="item">
      <div class="meta">
        <span>#{{ log.userId }}</span>
        <span>{{ dayjs(log.logAt).format('YYYY-MM-DD HH:mm') }}</span>
      </div>
      <p class="text">{{ log.text }}</p>
      <div v-if="log.tags.length" class="tags">
        <span v-for="t in log.tags" :key="t">#{{ t }}</span>
      </div>
    </article>
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
  }

  .item {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 12px 16px;
    background: var(--el-bg-color-overlay);
    border-radius: 8px;

    > .meta {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      color: var(--el-text-color-secondary);
    }

    > .text {
      white-space: pre-wrap;
      word-break: break-word;
    }

    > .tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      font-size: 12px;
      color: var(--el-color-primary);
    }
  }

  .footer {
    padding: 16px 0;
    text-align: center;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
}
</style>
