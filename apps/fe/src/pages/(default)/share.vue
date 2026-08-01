<!--
分享：
- 展示全局 share store 中匿名加载的固定或动态分享。
- 复用默认布局但不要求登录，处理链接缺失、失效和加载失败状态。
-->
<script lang="ts" setup>
import { listSharedLogs, type Log } from '@/api'
import { useShareStore } from '@/stores/share'

definePage({ meta: { title: '分享' } })

const route = useRoute()
const { token } = storeToRefs(useShareStore())
/** 当前分享已加载的 Log */
const logs = ref<Log[]>([])
/** undefined 表示尚未加载，null 表示后端已返回末页 */
const cursor = ref<number | null>()
/** 当前页面已初始化的分享凭证 */
let activeToken: string | undefined
/** 只接受最后一次请求结果，避免旧分享的迟到响应覆盖新数据 */
const {
  state: result,
  isLoading: loading,
  error: failed,
  execute,
} = useAsyncState(
  () =>
    listSharedLogs({
      token: token.value!,
      cursor: cursor.value ?? undefined,
    }),
  undefined,
  { immediate: false },
)

watch(result, (value) => {
  if (!value) return
  logs.value =
    cursor.value === undefined ? value.items : [...logs.value, ...value.items]
  cursor.value = value.cursor
})

/** 加载当前分享的下一页 */
const fetchMore = () => {
  if (!token.value || loading.value || cursor.value === null) return
  return execute()
}

/** 切换分享凭证时重置分页并加载首页 */
const open = (value: string) => {
  if (activeToken === value) return

  activeToken = value
  token.value = value
  logs.value = []
  cursor.value = undefined
  loading.value = false
  void fetchMore()
}

/** 进入或切换分享链接时，由分享页自行初始化全局状态 */
watch(
  () => route.fullPath,
  () => {
    if (route.path !== '/share') return
    const queryToken = Array.isArray(route.query.token)
      ? route.query.token[0]
      : route.query.token
    open(queryToken?.trim() ?? '')
  },
  { immediate: true },
)

/** 列表底部提示语；空串表示还有下一页且当前无需提示 */
const footerText = computed(() => {
  if (loading.value) return '加载中…'
  if (cursor.value !== null) return ''
  return logs.value.length ? '没有更多了' : '分享中暂无内容'
})
</script>

<template>
  <ElScrollbar
    class="share default-scrollbar"
    wrap-class="wrap"
    view-class="view"
    :distance="720"
    @end-reached="(d) => d === 'bottom' && fetchMore()"
  >
    <ElEmpty
      v-if="!token || (failed && !logs.length)"
      class="state m-panel"
      :description="token ? '无法打开分享' : '分享链接不完整'"
    >
      <ElButton v-if="token" type="primary" @click="fetchMore">
        重新加载
      </ElButton>
    </ElEmpty>
    <ElSkeleton
      v-else-if="loading && !logs.length"
      class="state m-panel"
      :rows="6"
      animated
    />
    <template v-else>
      <LogCard v-for="log in logs" :key="log.id" :log="log" />
      <div v-if="failed" class="footer">
        <ElButton link type="primary" @click="fetchMore">
          加载失败，重试
        </ElButton>
      </div>
      <div v-else-if="footerText" class="footer">{{ footerText }}</div>
    </template>
  </ElScrollbar>
</template>

<style lang="scss" scoped>
.share {
  :deep(> .wrap > .view) {
    > .state {
      padding: 24px;
    }

    > .footer {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px 0;
      font-size: 12px;
      color: var(--el-text-color-secondary);
    }
  }
}
</style>
