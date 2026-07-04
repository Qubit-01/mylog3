import { defineStore } from 'pinia'
import type { Log } from '@/api'

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

  /** 更新单条 log（编辑后调用），所有列表自动同步 */
  const update = (log: Log) => {
    entities[log.id] = log
  }

  /** 从指定列表移除某条 log；entities 保留避免影响其他列表 */
  const remove = (key: LogListKey, id: number) => {
    const ids = lists[key]
    const i = ids.indexOf(id)
    if (i !== -1) ids.splice(i, 1)
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
    /** 更新单条 log，所有列表自动响应 */
    update,
    /** 从指定列表移除某条 log */
    remove,
  }
})
