import { type DependencyList, type MutableRefObject, useRef } from 'react'
import { useEffectUpdate } from './useEffectUpdate'

/**
 * 返回一个依赖变化时同步更新的 Ref 对象
 *
 * 常用于闭包里要取最新的值。
 *
 * ```ts
 * const xxxRef = useRefSync(() => ({ test: data.xxx }), [data]);
 * ```
 */
export const useRefSync = <T>(
  factory: () => T,
  deps?: DependencyList,
): MutableRefObject<T> => {
  const v = useRef<T>(factory())

  useEffectUpdate(() => {
    v.current = factory()
  }, deps)

  return v
}
