import type { Directive } from 'vue'
import './index.css'

/**
 * 超出省略号，传入行数，默认一行，0就啥都不干
 * @param value 行数，支持响应式
 */
export const vEllipsis: Directive = (el: HTMLElement, { value = 1 }) => {
  const css = [
    '_qu-ellipsis',
    '_qu-ellipsis-multi',
    '--qu-ellipsis-line-clamp',
  ] as const

  // 先去除之前的样式
  el.classList.remove(css[0], css[1])
  el.style.removeProperty(css[2])

  const line = Number(value)
  if (Number.isNaN(line) || line < 0) {
    console.warn('vEllipsis: value 不是有效值', value)
    return
  }

  if (line === 1) {
    el.classList.add(css[0])
    el.style.removeProperty(css[2])
  } else if (line > 1) {
    el.classList.add(css[1])
    el.style.setProperty(css[2], line.toString())
  }
}
