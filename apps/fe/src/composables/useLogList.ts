import { listMineLogs, listPublicLogs } from '@/api'
import { type LogListKey, useLogStore } from '@/stores/log'

/** 每页条数 */
const TAKE = 20

/** 列表键到接口的映射，调用方只需要关心当前列表语义 */
const fetchers = {
  /** 公开 Log 列表接口 */
  public: listPublicLogs,
  /** 我的 Log 列表接口 */
  mine: listMineLogs,
}

/**
 * 可分页 Log 列表的通用逻辑
 * @param key 列表键，决定写入 store 的哪个列表
 */
export const useLogList = (key: LogListKey) => {
  const store = useLogStore()

  /** 当前列表（从 store 派生，编辑单条后自动响应） */
  const logs = store.useList(key)

  const loading = ref(false)
  const noMore = ref(false)

  /** 加载下一页；返回条数 < TAKE 视为末页 */
  const fetchMore = async () => {
    if (loading.value || noMore.value) return
    loading.value = true
    try {
      const rows = await fetchers[key]({ skip: logs.value.length, take: TAKE })
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

  onMounted(fetchMore)

  return {
    /** 当前列表数据，编辑任意 log 后自动同步 */
    logs,
    /** 是否正在加载 */
    loading,
    /** 是否已无更多数据 */
    noMore,
    /** 拉取下一页（ElScrollbar `@end-reached` 需自行过滤 direction） */
    fetchMore,
    /** 底部提示语，空串表示不展示 */
    footerText,
  }
}
