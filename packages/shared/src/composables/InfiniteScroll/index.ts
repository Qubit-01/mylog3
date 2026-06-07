import { nextTick } from 'vue'
import { throttle } from 'lodash-unified'
import type { ComponentPublicInstance, ObjectDirective } from 'vue'
import { getOffsetTopDistance, getScrollContainer } from './utils'

export const SCOPE = 'QuInfiniteScroll'
export const CHECK_INTERVAL = 50

const attributes = {
  /** 节流时延，单位为ms */
  delay: {
    type: Number,
    default: 200,
  },
  /** 触发加载的距离阈值，单位为px */
  distance: {
    type: Number,
    default: 1,
  },
  /** 是否禁用 */
  disabled: {
    type: Boolean,
    default: false,
  },
  /** 是否立即执行加载方法，以防初始状态下内容无法撑满容器。 */
  immediate: {
    type: Boolean,
    default: true,
  },
}

type Attrs = typeof attributes
type ScrollOptions = { [K in keyof Attrs]: Attrs[K]['default'] }
type InfiniteScrollCallback = () => void
type InfiniteScrollEl = HTMLElement & {
  [SCOPE]: {
    container: HTMLElement | Window
    containerEl: HTMLElement
    instance: ComponentPublicInstance | Record<string, any>
    delay: number // export for test
    lastScrollTop: number
    cb: InfiniteScrollCallback
    onScroll: () => void
    observer?: MutationObserver
  }
}

/**
 * 获取参数
 * @param el 元素
 * @param instance 实例
 * @returns 参数
 */
const getScrollOptions = (
  el: HTMLElement,
  instance: Record<string, any>,
): ScrollOptions => {
  const acm: Record<string, any> = {}
  Object.entries(attributes).forEach(([name, option]) => {
    const { type, default: defaultValue } = option
    const attrVal = el.getAttribute(`infinite-scroll-${name}`)
    // @ts-ignore
    let value = instance[attrVal] ?? attrVal ?? defaultValue
    value = type(value === 'false' ? false : value)
    acm[name] = Number.isNaN(value) ? defaultValue : value
  })
  return acm as ScrollOptions
}

const destroyObserver = (el: InfiniteScrollEl) => {
  const { observer } = el[SCOPE]

  if (observer) {
    observer.disconnect()
    delete el[SCOPE].observer
  }
}

const handleScroll = (el: InfiniteScrollEl, cb: InfiniteScrollCallback) => {
  const { container, containerEl, instance, observer, lastScrollTop } =
    el[SCOPE]
  const { disabled, distance } = getScrollOptions(el, instance)
  const { clientHeight, scrollHeight, scrollTop } = containerEl
  const delta = scrollTop - lastScrollTop

  el[SCOPE].lastScrollTop = scrollTop

  // trigger only if full check has done and not disabled and scroll down
  if (observer || disabled || delta < 0) {
    return
  }

  let shouldTrigger = false

  if (container === el) {
    shouldTrigger = scrollHeight - (clientHeight + scrollTop) <= distance
  } else {
    // get the scrollHeight since el might be visible overflow
    const { clientTop, scrollHeight: height } = el
    const offsetTop = getOffsetTopDistance(el, containerEl)
    shouldTrigger =
      scrollTop + clientHeight >= offsetTop + clientTop + height - distance
  }

  if (shouldTrigger) {
    cb.call(instance)
  }
}

function checkFull(el: InfiniteScrollEl, cb: InfiniteScrollCallback) {
  const { containerEl, instance } = el[SCOPE]

  const { disabled } = getScrollOptions(el, instance)

  if (disabled || containerEl.clientHeight === 0) {
    return
  }

  if (containerEl.scrollHeight <= containerEl.clientHeight) {
    cb.call(instance)
  } else {
    destroyObserver(el)
  }
}

/** 无限滚动指令 */
const vInfiniteScroll: ObjectDirective<
  InfiniteScrollEl,
  InfiniteScrollCallback
> = {
  async mounted(el, binding) {
    const { instance, value: cb } = binding

    if (!cb) {
      console.error("'v-infinite-scroll' 的参数必须是一个函数")
      return
    }

    await nextTick()

    const { delay, immediate } = getScrollOptions(el, instance!)
    const container = getScrollContainer(el, true)

    const containerEl =
      container === window
        ? document.documentElement
        : (container as HTMLElement)

    const onScroll = throttle(handleScroll.bind(null, el, cb), delay)

    if (!container) {
      return
    }

    el[SCOPE] = {
      instance: instance!,
      container,
      containerEl,
      delay,
      cb,
      onScroll,
      lastScrollTop: containerEl.scrollTop,
    }

    if (immediate) {
      const observer = new MutationObserver(
        throttle(checkFull.bind(null, el, cb), CHECK_INTERVAL),
      )
      el[SCOPE].observer = observer
      observer.observe(el, { childList: true, subtree: true })
      checkFull(el, cb)
    }

    container.addEventListener('scroll', onScroll)
  },
  unmounted(el) {
    if (!el[SCOPE]) {
      return
    }
    const { container, onScroll } = el[SCOPE]

    container?.removeEventListener('scroll', onScroll)
    destroyObserver(el)
  },
  async updated(el) {
    if (!el[SCOPE]) {
      await nextTick()
    } else {
      const { containerEl, cb, observer } = el[SCOPE]
      if (containerEl.clientHeight && observer) {
        checkFull(el, cb)
      }
    }
  },
}

export default vInfiniteScroll
