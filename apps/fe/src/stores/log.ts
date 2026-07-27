import { listMineLogs, listPublicLogs, type Log, type Where } from '@/api'

/** 已注册的列表键；后续新增列表只需在这里加一项 */
type ListKey = 'public' | 'mine'

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
  const lists = reactive<Record<ListKey, number[]>>({ public: [], mine: [] })

  /** 取某个列表当前的完整 Log 数组（响应式） */
  const useList = (key: ListKey) =>
    computed(() => lists[key].map((id) => entities[id]))

  /** 将一批 log 合并进 entities，并按后端排序去重追加到指定列表 */
  const append = (key: ListKey, logs: Log[]) => {
    for (const log of logs) entities[log.id] = log
    lists[key] = [...new Set([...lists[key], ...logs.map(({ id }) => id)])]
    const field = key === 'public' ? 'createdAt' : 'logAt'
    lists[key].sort(
      (a, b) => dayjs(entities[b][field]).diff(entities[a][field]) || b - a,
    )
  }

  /** 合并单条 log，并按可见范围同步当前已知列表 */
  const upsert = (log: Log) => {
    append('mine', [log])
    if (log.scope === 'PUBLIC') append('public', [log])
    else lists.public = lists.public.filter((id) => id !== log.id)
  }

  /** 移除指定 log：清理实体及所有列表里的引用 */
  const remove = (id: number) => {
    for (const key of Object.keys(lists) as ListKey[]) {
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
 * @param where “我的 Log”筛选条件；变化时重置列表并从第一页重新加载
 */
export const useLogList = (key: ListKey, where?: Ref<Where>) => {
  const store = useLogStore()
  const logs = store.useList(key)
  /** undefined 表示尚未加载，null 表示后端已返回末页 */
  const cursor = ref<number | null>()
  /** VueUse 只让最新一次执行更新 result，避免旧筛选请求覆盖新列表 */
  const {
    state: result,
    isLoading: pending,
    execute,
  } = useAsyncState(
    () =>
      key === 'public'
        ? listPublicLogs({ cursor: cursor.value ?? undefined })
        : listMineLogs({
            cursor: cursor.value ?? undefined,
            where: where?.value,
          }),
    undefined,
    { immediate: false },
  )

  watch(result, (value) => {
    if (!value) return
    store.append(key, value.items)
    cursor.value = value.cursor
  })

  /** 加载当前列表的下一页；并发加载或已到末页时跳过 */
  const fetchMore = () => {
    if (pending.value || cursor.value === null) return
    return execute()
  }

  /** 清空当前结果与游标，按最新筛选条件重新加载第一页 */
  const refresh = () => {
    store.lists[key] = []
    cursor.value = undefined
    return execute()
  }

  /** 底部提示语；空串表示不展示 */
  const footerText = computed(() => {
    if (pending.value) return '加载中…'
    if (cursor.value !== null) return ''
    return logs.value.length ? '没有更多了' : '暂无内容'
  })

  if (where) watch(where, refresh)
  onMounted(refresh)

  return {
    /** 当前列表数据，编辑任意 log 后自动同步 */
    logs,
    /** 底部提示语，空串表示不展示 */
    footerText,
    /** 加载当前列表的下一页 */
    fetchMore,
    /** 清空已有结果并按当前条件重新加载 */
    refresh,
  }
}
