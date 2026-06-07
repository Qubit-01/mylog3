import { DependencyList, EffectCallback, useEffect, useRef } from 'react'
import { useEffectUpdate } from './useEffectUpdate'

/**
 * 忽略首次执行，只在依赖更新时执行，且仅执行一次
 *
 * 常用于主接口数据首次变化的埋点。
 *
 * ```ts
 * useEffectUpdateOnce(() => {}, [data]);
 * ```
 */
export const useEffectUpdateOnce: typeof useEffect = (
  effect: EffectCallback,
  deps?: DependencyList,
) => {
  const hasRun = useRef(false)

  useEffectUpdate(() => {
    if (hasRun.current) return
    hasRun.current = true
    return effect()
  }, deps)

  useEffect(() => {
    return () => {
      hasRun.current = false
    }
  }, [])
}
