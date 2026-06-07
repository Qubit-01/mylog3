import { DependencyList, EffectCallback, useEffect, useRef } from 'react'

/**
 * 忽略首次执行，只在依赖更新时执行
 *
 * ```ts
 * useEffectUpdate(() => {}, [data]);
 * ```
 */
export const useEffectUpdate: typeof useEffect = (
  effect: EffectCallback,
  deps?: DependencyList,
) => {
  const isMounted = useRef(false)

  useEffect(() => {
    if (!isMounted.current) isMounted.current = true
    else return effect()
  }, deps)

  useEffect(() => {
    return () => {
      isMounted.current = false
    }
  }, [])
}
