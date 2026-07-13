<script lang="ts" setup>
/** Log 详情：在默认布局内按 query.id 沉浸式展示单条记录 */
import { getLog, type Log } from '@/api'
import dayjs from 'dayjs'

definePage({ meta: { title: 'Log 详情' } })

const route = useRoute()
/** 当前详情实体；接口响应整体替换，无需深层响应式 */
const log = shallowRef<Log>()
const pending = ref(false)
const failed = ref(false)
const requestId = ref(0)

/** 当前 query 中的正整数 Log id；格式无效时返回 undefined */
const id = computed(() => {
  const value = Array.isArray(route.query.id)
    ? route.query.id[0]
    : route.query.id
  return value && /^[1-9]\d*$/.test(value) ? Number(value) : undefined
})

/** query 变化时加载对应实体，并忽略已过期请求的状态回写 */
watch(
  id,
  async (currentId) => {
    const currentRequestId = ++requestId.value
    log.value = undefined
    pending.value = false
    failed.value = false
    if (!currentId) return

    pending.value = true
    try {
      const result = await getLog({ id: currentId })
      if (currentRequestId === requestId.value) log.value = result
    } catch {
      if (currentRequestId === requestId.value) failed.value = true
    } finally {
      if (currentRequestId === requestId.value) pending.value = false
    }
  },
  { immediate: true },
)
</script>

<template>
  <ElScrollbar
    class="log default-scrollbar"
    wrap-class="wrap"
    view-class="view"
  >
    <ElSkeleton v-if="pending" class="state m-panel" :rows="6" animated />
    <ElEmpty v-else-if="!id" class="state m-panel" description="Log 链接无效" />
    <ElEmpty
      v-else-if="failed || !log"
      class="state m-panel"
      description="Log 不存在或无权查看"
    />

    <article v-else class="content m-panel">
      <header class="meta">
        <span>#{{ log.userId }}</span>
        <time :datetime="log.logAt">
          {{ dayjs(log.logAt).format('YYYY-MM-DD HH:mm') }}
        </time>
      </header>
      <p class="text">{{ log.text }}</p>
    </article>
  </ElScrollbar>
</template>

<style lang="scss" scoped>
.log {
  .state {
    padding: 24px;
  }

  .content {
    display: flex;
    flex-direction: column;
    gap: 20px;
    padding: clamp(20px, 5vw, 48px);

    > .meta {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      font-size: 13px;
      color: var(--el-text-color-secondary);
    }

    > .text {
      font-size: clamp(17px, 2.6vw, 20px);
      line-height: 1.8;
      white-space: pre-wrap;
      word-break: break-word;
    }
  }
}
</style>
