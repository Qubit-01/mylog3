import { ref, type Directive, h, render, type Raw } from 'vue'
import type { Placement } from '../Floating'
import MultiMenu from './index.vue'

export { MultiMenu }

/** item，下拉菜单项：不传 children 时当普通菜单项用，写点击事件 */
export type MenuItem = {
  type: 'item'
  /** 显示文字 */
  text: string
  /** 图标 */
  icon?: string
  /** 下一级菜单 */
  children?: MultiMenuData[]
  /** 点击的回调 */
  onClick?: () => void
}

/** group 分组(分割线) 给菜单分组 */
export type MenuGroup = {
  type: 'group'
  /** 显示文字 */
  text: string
}

/** link 链接 */
export type MenuLink = {
  type: 'link'
  /** 显示文字 */
  text: string
  /** 链接 */
  link: string
  /** 图标 */
  icon?: string
}

/** diy 自定义菜单项 */
export type MenuDiy = {
  type: 'diy'
  /** dom 或者是组件 */
  dom: Raw<any>
  /** 传入组件的数据 */
  props?: Record<string, any>
}

/** 菜单数据 */
export type MultiMenuData =
  // 通用菜单项
  {
    /** 每个菜单项的唯一标识，会加载每个子项上，省略的话会自动生成 */
    id?: string
  } & (MenuItem | MenuGroup | MenuLink | MenuDiy)

const createdSet = new Set<HTMLElement>()

/**
 * 初始化下拉菜单
 * 懒触发：只有在首次 hover 时才会创建
 * @param el 是触发元素，而props.relate 是菜单相对于哪个元素定位
 * @param props 组件的参数，其中 relate 默认是 el
 * @param options 配置项，className 是容器的类名，show 是默认是否展示
 * @returns show
 */
export const initMultiMenu = (
  el: HTMLElement,
  props: Ref<{
    menu: MultiMenuData[]
    placement: Placement
    relate?: HTMLElement
  }>,
  options?: {
    className?: string
    show?: boolean
    /** 挂载后调用 */
    onMounted?: (container: HTMLElement) => void
    /** 菜单显示时调用 */
    onShow?: () => void
    /** 菜单隐藏时调用 */
    onHide?: () => void
  },
) => {
  if (createdSet.has(el)) {
    return
  }
  createdSet.add(el)

  const container = document.createElement('div')
  container.className = `multi-menu-container ${options?.className ?? ''}`
  document.body.appendChild(container)

  const show = ref(options?.show ?? true)
  const menuVNode = h(MultiMenu, { show, relate: el, ...props.value })
  render(menuVNode, container)
  options?.onMounted?.(container)
  show.value && options?.onShow?.()

  el.addEventListener('pointerenter', () => {
    show.value = true
    const menuVNode = h(MultiMenu, { show, relate: el, ...props.value })
    render(menuVNode, container)
    options?.onShow?.()
  })
  el.addEventListener('pointerleave', () => {
    show.value = false
    options?.onHide?.()
  })

  return { show }
}

/**
 * 下拉菜单组件快捷指令
 * 默认通过 hover 控制显示隐藏
 * 懒加载：只有在首次 hover 时才会创建
 * todo: 卸载时销毁
 */
export const vMultiMenu: Directive = {
  mounted(el, { arg, value = [] }) {
    initMultiMenu(el, ref({ menu: value, placement: arg as Placement }), {
      show: false,
    })
  },
}
