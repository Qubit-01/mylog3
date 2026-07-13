<script lang="ts" setup>
/** Log 详情：在默认布局内按 query.id 沉浸式展示单条记录 */
import { getLog } from '@/api'
import dayjs from 'dayjs'

definePage({ meta: { title: '详情' } })

const route = useRoute()
const pending = ref(false)

/** 当前 query 中的正整数 Log id；格式无效时返回 undefined */
const id = computed(() => {
  const value = Array.isArray(route.query.id)
    ? route.query.id[0]
    : route.query.id
  return value && /^[1-9]\d*$/.test(value) ? Number(value) : undefined
})

/** 随 query.id 自动加载详情；无效参数或请求失败统一返回空状态 */
const log = computedAsync(
  () =>
    id.value ? getLog({ id: id.value }).catch(() => undefined) : undefined,
  undefined,
  pending,
)
</script>

<template>
  <ElScrollbar
    class="log default-scrollbar"
    wrap-class="wrap"
    view-class="view"
  >
    <ElSkeleton v-if="pending" class="state m-panel" :rows="6" animated />
    <ElEmpty
      v-else-if="!log"
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
