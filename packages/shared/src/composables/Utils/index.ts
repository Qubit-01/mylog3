import { isClient, camelize } from '@vueuse/core'
import type { CSSProperties } from 'vue'

/**
 * 获取元素css属性值
 * @param element 元素
 * @param styleName css属性名
 * @returns 属性值，找不到返回空字符串
 */
export const getStyle = (
  element: HTMLElement,
  styleName: keyof CSSProperties,
): string => {
  if (!isClient || !element || !styleName) return ''

  let key = camelize(styleName)
  if (key === 'float') key = 'cssFloat'
  try {
    const style = (element.style as any)[key]
    if (style) return style
    // 如果没有，尝试获取计算样式
    const computed: any = document.defaultView?.getComputedStyle(element, '')
    return computed ? computed[key] : ''
  } catch {
    return (element.style as any)[key]
  }
}

/**
 * 获取元素距离文档顶部的距离
 * 通过递归获取元素的offsetTop，直到没有offsetParent，一直累加
 * @param el 元素
 * @returns 元素距离文档顶部的距离
 */
export const getOffsetTop = (el: HTMLElement) => {
  let offset = 0
  let parent = el

  while (parent) {
    offset += parent.offsetTop
    parent = parent.offsetParent as HTMLElement
  }

  return offset
}

/**
 * 获取元素距离容器顶部的距离
 * 通过获取元素的offsetTop和容器的offsetTop，取绝对值
 * @param el 元素
 * @param containerEl 容器元素
 * @returns 元素距离容器顶部的距离
 */
export const getOffsetTopDistance = (
  el: HTMLElement,
  containerEl: HTMLElement,
) => {
  return Math.abs(getOffsetTop(el) - getOffsetTop(containerEl))
}

/**
 * 格式化数字，保留小数点后1位
 * 如果 count 不是数字，则返回 undefined
 * 如果 count 小于 1 万，则返回原数字
 * 如果 count 大于等于 1 万，则返回格式化后的字符串
 * @param count 数字，只能大于等于 0
 * @returns 格式化后的数字
 */
export const formatCount = (count: any): number | string | undefined => {
  const num = Number(count)
  if (Number.isNaN(num)) {
    console.warn('formatCount: count 不是数字', count)
    return undefined
  }

  const tenThousand = 1e4
  if (num < tenThousand) {
    return num
  }

  const billion = 1e8
  if (num < billion) {
    return +(num / tenThousand).toFixed(1) + '万'
  }

  return +(num / billion).toFixed(1) + '亿'
}
