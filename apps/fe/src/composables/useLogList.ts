import type { Log } from '@/api'
import { type LogListKey, useLogStore } from '@/stores/log'

/** 每页条数 */
const TAKE = 20

/**
 * 可分页 Log 列表的通用逻辑
 * @param key 列表键，决定写入 store 的哪个列表
 * @param fetcher 实际的接口调用，接收 skip/take，返回 Log 数组
 */
export const useLogList = (
  key: LogListKey,
  fetcher: (skip: number, take: number) => Promise<Log[]>,
) => {
  const store = useLogStore()

  /** 当前列表（从 store 派生，编辑单条后自动响应） */
  const logs = store.useList(key)

  const loading = ref(false)
  const noMore = ref(false)

  /** 加载下一页；返回条数 < TAKE 视为末页 */
  const loadMore = async () => {
    if (loading.value || noMore.value) return
    loading.value = true
    try {
      const rows = await fetcher(logs.value.length, TAKE)
      store.append(key, rows)
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

  return {
    /** 当前列表数据，编辑任意 log 后自动同步 */
    logs,
    /** 是否正在加载 */
    loading,
    /** 是否已无更多数据 */
    noMore,
    /** 加载下一页（ElScrollbar `@end-reached` 需自行过滤 direction） */
    loadMore,
    /** 底部提示语，空串表示不展示 */
    footerText,
  }
}
