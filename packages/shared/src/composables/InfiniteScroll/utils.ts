import { isClient, camelize } from '@vueuse/core'
import type { CSSProperties } from 'vue'

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
 * 判断元素是否能滚动
 * @param el 元素
 * @param isVertical 是否垂直滚动
 * @returns 是否能滚动
 */
export const isScroll = (el: HTMLElement, isVertical?: boolean): boolean => {
  if (!isClient) return false

  const key = (
    {
      undefined: 'overflow',
      true: 'overflow-y',
      false: 'overflow-x',
    } as const
  )[String(isVertical)]!
  const overflow = getStyle(el, key)

  return ['scroll', 'auto', 'overlay'].some((s) => overflow.includes(s))
}

/**
 * 找出元素父级滚动容器
 * @param el 元素
 * @param isVertical 是否垂直滚动
 * @returns 元素
 */
export const getScrollContainer = (
  el: HTMLElement,
  isVertical?: boolean,
): Window | HTMLElement | undefined => {
  if (!isClient) return

  let parent: HTMLElement = el
  while (parent) {
    if ([window, document, document.documentElement].includes(parent))
      return window

    if (isScroll(parent, isVertical)) return parent

    parent = parent.parentNode as HTMLElement
  }

  return parent
}
