<script lang="ts" setup>
import { computed, unref, type MaybeRef } from 'vue'
import type { Relate, Placement } from '@pet/quantum.Floating'
import MultiMenuSub from './MultiMenuSub.vue'
import type { MultiMenuData } from '.'

const props = withDefaults(
  defineProps<{
    /** 菜单数据 */
    menu: MultiMenuData[]
    /** 逻辑控制显示与否，默认true */
    show?: MaybeRef<boolean>
    /** 相对的dom元素或者选择器 */
    relate?: Relate
    /** 菜单定位位置 */
    placement?: Placement
    /** 去除延迟消失 */
    noDelay?: boolean
  }>(),
  {
    show: true,
    // placement: 'right-start',
  },
)

// 手动解包，为了兼容传入的 show 是 ref 的情况，指令式调用时会这样
const realShow = computed(() => unref(props.show))

// 为每个菜单项加入 id
const handleData = computed<MultiMenuData[]>(() => {
  const assignIds = (menu: MultiMenuData[]): MultiMenuData[] =>
    menu.map((item) => {
      const newItem = { ...item }
      newItem.id = newItem.id ?? Math.random().toString(36).slice(2)
      if (newItem.type === 'item' && newItem.children) {
        newItem.children = assignIds(newItem.children)
      }
      return newItem
    })
  return assignIds(props.menu)
})
</script>
<!--
    1. 对data每个元素加入 id
    2. css 变量注入
-->
<template>
  <MultiMenuSub
    class="MultiMenu"
    :menu="handleData"
    :show="realShow"
    :placement="placement"
    :no-delay="noDelay"
    :relate="relate"
  />
</template>

<style lang="scss" scoped>
.MultiMenu {
  z-index: var(--multi-menu-z-index);
}

:global(:root) {
  /** 每个菜单项的宽高 */
  --multi-menu-item-width: 212px;
  --multi-menu-item-height: 40px;
  /** 菜单间的间隔 */
  --multi-menu-item-gap: 4px;
  /** 菜单的最大高度 */
  --multi-menu-max-height: 482px;
  /** 菜单的层级 */
  --multi-menu-z-index: 100;

  /** 菜单项的字体大小 */
  --multi-menu-item-font-size: 16px;
  /** 菜单项的字体颜色 */
  --multi-menu-item-color: #fff8;
  /** 菜单的背景色 */
  --multi-menu-background-color: #252836;

  /** 菜单项 hover时的背景色 */
  --multi-menu-item-hover-background-color: #2d3444;
  /** 菜单项 hover时的字体颜色 */
  --multi-menu-item-hover-color: #fff;
}

:deep(*) {
  box-sizing: border-box;
}
</style>
