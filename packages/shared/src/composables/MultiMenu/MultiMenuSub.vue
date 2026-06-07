<script lang="ts" setup>
import { ref, watch } from 'vue'
import Floating, {
  offset,
  shift,
  flip,
  type Placement,
  type Relate,
} from '@pet/quantum.Floating'
import type { MenuItem, MultiMenuData } from '.'

const props = withDefaults(
  defineProps<{
    /** 通过 js 显示的 API，默认为 true */
    show?: boolean
    /** 菜单参数 */
    menu: MultiMenuData[]
    /** 相对的dom元素或者选择器，不传就相对于父元素定位 */
    relate?: Relate
    /** 菜单位置，默认rt */
    placement?: Placement
    /** 去除延迟消失 */
    noDelay?: boolean
  }>(),
  {
    show: true,
    placement: 'right-start',
  },
)

// 通过外部传入的show，延迟关闭自身
const delayShow = ref(false)
// 鼠标是否在菜单内
const selfPoint = ref(false)
let delayShowTimer: ReturnType<typeof setTimeout> | undefined
watch(
  [() => props.show, () => props.noDelay, selfPoint],
  ([show, noDelay]) => {
    clearTimeout(delayShowTimer)
    // 如果鼠标在菜单内，不关闭
    if (selfPoint.value) {
      delayShow.value = true
      return
    }
    // 当 noDelay 为 true 时，立即响应 show 的变化
    if (show || noDelay) {
      delayShow.value = show
    } else {
      delayShowTimer = setTimeout(() => {
        delayShow.value = show
      }, 100)
    }
  },
  { immediate: true },
)

// 控制子菜单显示，同时只能有一个子菜单显示
const subIndex = ref(-1)

const handlePointerEnter = (item: MenuItem, i: number) => {
  subIndex.value = i
  // hover 在子菜单的时候，触发埋点上报
  if (item?.children && item.type === 'item') item?.onClick?.()
}

const gap = 4 // parseFloat(getComputedStyle(selfEl.value).getPropertyValue('--multi-menu-item-gap'));
const middleware = [
  offset(gap),
  flip({ crossAxis: false }),
  shift({ padding: gap }),
]
</script>

<!-- 每一行，字和下一个菜单 -->
<template>
  <Floating
    v-model:show="delayShow"
    class="MultiMenuSub"
    :relate="relate"
    :placement="placement"
    :options="{ middleware }"
    @pointerenter="selfPoint = true"
    @pointerleave="selfPoint = false"
  >
    <div class="list">
      <!-- 不同type的元素对应不同的显示 -->
      <template v-for="(item, i) of menu" :key="item.id">
        <!-- item 普通菜单项 -->
        <div v-if="item.type === 'item'" class="item">
          <div
            class="contiainer"
            :class="{ hover: subIndex === i }"
            @pointerenter="() => handlePointerEnter(item, i)"
            @pointerleave="subIndex = -1"
            @click="item.onClick"
          >
            <!-- 图标 -->
            <img v-if="item.icon" class="icon" :src="item.icon" />
            <!-- 文字 -->
            <div class="text">{{ item.text }}</div>
            <!-- 占据剩余空间 -->
            <div style="flex: 1" />
            <!-- 箭头 -->
            <div v-if="item.children" class="sub-icon" />
          </div>
        </div>
        <MultiMenuSub
          v-if="item.type === 'item' && item.children"
          :menu="item.children"
          :show="subIndex === i"
          :placement="placement.includes('left') ? 'left-start' : 'right-start'"
          :no-delay="
            subIndex > -1 &&
            (menu[subIndex] as MenuItem)?.children &&
            subIndex !== i
          "
          @pointerenter="() => handlePointerEnter(item, i)"
          @pointerleave="subIndex = -1"
        />

        <!-- 分组的模块分割线 -->
        <div v-else-if="item.type === 'group'" class="group">
          <div class="line" />
          <div class="text">{{ item.text }}</div>
        </div>

        <!-- 链接 -->
        <div v-else-if="item.type === 'link'" class="link item">
          <a class="contiainer" :href="item.link" target="_blank">
            <!-- 图标 -->
            <img v-if="item.icon" class="icon" :src="item.icon" alt="icon" />
            <div class="text">{{ item.text }}</div>
            <!-- 占据剩余空间 -->
            <div style="flex: 1" />
          </a>
        </div>

        <!-- 自定义元素 -->
        <div v-else-if="item.type === 'diy'" class="diy">
          <component :is="item.dom" v-bind="item.props" />
        </div>
      </template>
    </div>
  </Floating>
</template>

<style lang="scss" scoped>
.MultiMenuSub {
  width: var(--multi-menu-item-width);
  font-size: var(--multi-menu-item-font-size);
  color: var(--multi-menu-item-color);
  background-color: var(--multi-menu-background-color);
  box-shadow: 0 0 13px #00000029;
  border-radius: 12px;

  > .list {
    max-height: var(--multi-menu-max-height);
    padding: 4px 0;

    overflow-x: hidden;
    overflow-y: auto;

    &::-webkit-scrollbar {
      width: 6px; // 不要滚动条就置为 0
    }
    &::-webkit-scrollbar-thumb {
      background: #ccc5;
      border-radius: 10px;
    }

    // 分组的模块分割线
    .group {
      width: 100%;
      padding: 0 16px;

      display: flex;
      flex-direction: column;
      opacity: 0.3;

      // 分割线
      > .line {
        width: 100%;
        height: 1px;
        background-color: rgba(255, 255, 255, 0.15);
        margin-top: 8px;
      }

      > .text {
        margin-top: 16px;
        margin-bottom: 6px;
        color: #ddd;
        font-size: 12px;
        font-weight: 400;
      }

      &:first-child {
        > .line {
          display: none;
        }
      }
    }

    // 链接
    .link {
      // 去除 a 标签自带样式
      a {
        text-decoration: none;
        color: unset;
      }
    }

    // 普通菜单项
    .item {
      position: relative;
      width: 100%;
      padding: 2px 6px;

      > .contiainer {
        width: 100%;
        height: var(--multi-menu-item-height);

        transition:
          color 0.3s,
          background-color 0.3s;
        border-radius: 10px;
        padding: 0 10px;
        cursor: pointer;

        display: flex;
        align-items: center;
        gap: 4px;

        // 1. 图标
        > .icon {
          width: 24px;
          height: 24px;
          margin-right: 5px;
          // 子菜单图标
          opacity: 0.5;
        }

        // 2. 文字
        > .text {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          overflow: hidden;
        }

        // 3. 子菜单箭头
        > .sub-icon {
          width: 6px;
          height: 10px;
          background-image: url(./assets/cur.svg);
          background-size: 100%;
          background-repeat: no-repeat;
          // filter: brightness(0); // 使图片变黑
          transition: opacity 0.3s;
          opacity: 0.5;
        }

        &.hover,
        &:hover {
          color: var(--multi-menu-item-hover-color);
          background-color: var(--multi-menu-item-hover-background-color);

          > .sub-icon,
          > .icon {
            opacity: 1;
          }
        }
      }
    }
  }
}
</style>
