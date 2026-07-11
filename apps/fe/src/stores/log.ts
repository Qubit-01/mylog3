import { defineStore } from 'pinia'
import { listMineLogs, listPublicLogs, type Log } from '@/api'

/** 已注册的列表键；后续新增列表只需在这里加一项 */
export type LogListKey = 'public' | 'mine'

/**
 * Log 实体缓存 store
 * - `entities`：所有已加载 log 的唯一真相来源，按 id 索引
 * - `lists`：各列表只存 id 顺序，渲染时从 entities 取值
 * - 编辑某条 log 只需更新 entities[id]，所有引用该 log 的列表自动响应
 */
export const useLogStore = defineStore('log', () => {
  /** 所有已加载的 log，key 为 log.id */
  const entities = reactive<Record<number, Log>>({})

  /** 各列表的 id 顺序表，key 为列表名 */
  const lists = reactive<Record<LogListKey, number[]>>({ public: [], mine: [] })

  /** 取某个列表当前的完整 Log 数组（响应式） */
  const useList = (key: LogListKey) =>
    computed(() => lists[key].map((id) => entities[id]))

  /** 将一批 log 合并进 entities，并将其 id 追加到指定列表末尾 */
  const append = (key: LogListKey, logs: Log[]) => {
    for (const log of logs) entities[log.id] = log
    lists[key].push(...logs.map((l) => l.id))
  }

  /** 合并单条 log，并按可见范围同步当前已知列表 */
  const upsert = (log: Log) => {
    entities[log.id] = log
    lists.mine = [log.id, ...lists.mine.filter((id) => id !== log.id)]
    lists.public =
      log.scope === 'PUBLIC'
        ? [log.id, ...lists.public.filter((id) => id !== log.id)]
        : lists.public.filter((id) => id !== log.id)
  }

  /** 移除指定 log：清理实体及所有列表里的引用 */
  const remove = (id: number) => {
    for (const key of Object.keys(lists) as LogListKey[]) {
      lists[key] = lists[key].filter((item) => item !== id)
    }
    delete entities[id]
  }

  return {
    /** 所有已加载 log 的实体字典 */
    entities,
    /** 各列表的 id 顺序表 */
    lists,
    /** 获取某个列表的响应式 Log 数组 */
    useList,
    /** 追加一页数据到指定列表 */
    append,
    /** 合并单条 log，并按可见范围同步当前已知列表 */
    upsert,
    /** 移除指定 log，并同步清理所有列表引用 */
    remove,
  }
})

/**
 * 连接页面生命周期与指定 Log 列表的分页状态
 * @param key 列表键，决定读取和加载的列表
 */
export const useLogList = (key: LogListKey) => {
  const store = useLogStore()
  const logs = store.useList(key)
  const pending = ref(false)
  const noMore = ref(false)

  /** 加载当前列表的下一页；并发加载或已到末页时跳过 */
  const fetchMore = async () => {
    if (pending.value || noMore.value) return
    pending.value = true
    try {
      const rows = await (key === 'public' ? listPublicLogs : listMineLogs)({
        skip: logs.value.length,
        take: 20,
      })
      store.append(key, rows)
      noMore.value = rows.length < 20
    } finally {
      pending.value = false
    }
  }

  /** 底部提示语；空串表示不展示 */
  const footerText = computed(() => {
    if (pending.value) return '加载中…'
    if (!noMore.value) return ''
    return logs.value.length ? '没有更多了' : '暂无内容'
  })

  onMounted(fetchMore)

  return {
    /** 当前列表数据，编辑任意 log 后自动同步 */
    logs,
    /** 是否正在请求下一页 */
    pending,
    /** 是否已无更多数据 */
    noMore,
    /** 底部提示语，空串表示不展示 */
    footerText,
    /** 加载当前列表的下一页 */
    fetchMore,
  }
}
