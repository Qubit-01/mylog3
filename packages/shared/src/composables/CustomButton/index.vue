<script lang="ts" setup>
import { ref } from 'vue'
import { debounce } from 'lodash-unified'

const props = defineProps<{
  /** 禁用状态 */
  disable?: boolean
  /** 去除默认按下动画，按下动效需要自定义时 */
  noDefaultActive?: boolean
  /* 扫光动效 */
  shine?: boolean
  /* 呼吸动效 */
  breath?: boolean
  /* 防抖时间间隔，默认200ms */
  debounceWait?: number
}>()

const emit = defineEmits<{
  /** 点击事件 */
  (e: 'click', params: Event): void
  /** 禁用时的点击事件 */
  (e: 'disabled-click', params: Event): void
}>()

// 按下状态
const active = ref(false)

// 添加了防抖的点击事件
const clickDebounce = debounce((e: Event) => {
  props.disable ? emit('disabled-click', e) : emit('click', e)
}, props.debounceWait)

defineExpose({ active })
</script>

<template>
  <div class="CustomButton" :class="{ active, disable }">
    <!-- 外框不应该变化，留给使用者加动效，组件内在inner上加动效 -->
    <div
      class="inner"
      :class="{
        _disable: disable,
        _active: !noDefaultActive && active,
        _breath: !disable && !active && breath,
      }"
    >
      <!-- 文字之下的层 -->
      <div class="lower-layer">
        <slot name="lower" :active="active">
          <!-- 默认背景 -->
          <div class="default-bg" />
        </slot>
      </div>
      <!-- 文字层 -->
      <div class="text-layer">
        <slot :active="active" />
      </div>
      <!-- 文字之上的层 -->
      <div class="upper-layer">
        <slot name="upper" :active="active" />
      </div>
      <!-- 触发点击事件的层 -->
      <div
        class="trigger-layer"
        @click="clickDebounce"
        @pointerdown.stop.prevent="active = true"
        @pointerup.stop.prevent="active = false"
        @pointerleave.stop.prevent="active = false"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.CustomButton {
  display: inline-flex;
  width: 72px;
  height: 36px;
  position: relative;

  .inner {
    width: 100%;
    height: 100%;
    position: relative;
    transition:
      transform 0.3s,
      opacity 0.3s;

    > * {
      width: 100%;
      height: 100%;
      position: absolute;
    }

    .lower-layer {
      /* 默认背景 */
      > .default-bg {
        width: 100%;
        height: 100%;
        background-color: #fe3666;
        border-radius: 9999px;
      }
    }

    .text-layer {
      display: flex;
      justify-content: center;
      align-items: center;
      color: white;
    }

    .upper-layer {
    }

    .trigger-layer {
      border-radius: 9999px;
      cursor: pointer;
    }

    // 默认禁用后的效果
    &._disable {
      opacity: 0.5;
      .trigger-layer {
        cursor: not-allowed;
      }
    }

    // 默认按下后的效果
    &._active {
      animation-play-state: paused;
      transform: scale(0.95);
      opacity: 0.5;
    }

    // 默认呼吸动效
    &._breath {
      animation: breath 1.333s steps(20) infinite;
      @keyframes breath {
        0% {
          transform: scale(1);
        }
        50% {
          transform: scale(0.96);
        }
        100% {
          transform: scale(1);
        }
      }
    }
  }
}
</style>
