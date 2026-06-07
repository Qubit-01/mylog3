<!-- 
传入步数、每一步的蒙层参数，由使用者控制
默认有平滑切换
-->
<script lang="ts" setup>
import { computed } from 'vue'

/**
 * 蒙版样式，会应用到蒙层上的css
 * 推荐这里传入会动态变化的蒙层参数，固定的参数使用:deep修改
 */
type MaskAttr = {
  /** 宽度 */
  width: string
  /** 高度 */
  height: string
  /** 距离可视区域顶部的距离 */
  top?: string
  /** 距离可视区域左边的距离，如果传入了isCenter，不用定义left */
  left?: string
  /** 其他需要自定义的css参数 */
  [key: string]: string | undefined
}
const props = defineProps<{
  /** 步数 */
  step: number
  /** 每一布的蒙层参数 */
  attrList: (() => MaskAttr)[]
  /** 蒙层是否要去除平滑切换，低端机上会掉帧 */
  noSmooth?: boolean
}>()
/** 点击框内外触发的事件 */
const emits = defineEmits(['clickInner', 'clickMask'])

/**
 * 蒙层样式
 * 0宽高的div，在老版本ios上会不渲染shadow，所以设置1px
 */
const maskStyle = computed<MaskAttr>(() => {
  const attr = props.attrList[props.step]?.() ?? {
    width: '0.1px',
    height: '0.1px',
  }
  if (!attr.width || attr.width === '0px') {
    attr.width = '0.1px'
  }
  if (!attr.height || attr.height === '0px') {
    attr.height = '0.1px'
  }
  return attr
})
</script>

<template>
  <div
    class="guide-strong"
    @click.stop="emits('clickMask')"
    @pointermove.prevent.stop
    @wheel.prevent.stop
  >
    <div
      class="guide-mask"
      :class="{ smooth: !noSmooth }"
      :style="maskStyle"
      @click.stop="emits('clickInner')"
    >
      <slot />
    </div>
    <div class="on-mask">
      <slot name="on-mask" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
:global(:root) {
  /* 引导变化时的帧数，开启了isSmooth才有用，0.3秒内要执行多少次计算 */
  --quantum-GuideStrong-steps: 10;
}
.guide-strong {
  position: fixed;
  width: 100%;
  height: 100%;
  z-index: 999;
  top: 0;

  .guide-mask {
    position: absolute;
    border-radius: 24px;
    box-shadow: 0 0 0 2000px rgba(0, 0, 0, 0.85);
    animation: fadeIn 333ms;

    &.smooth {
      transition:
        width 0.3s steps(var(--quantum-GuideStrong-steps)),
        height 0.3s steps(var(--quantum-GuideStrong-steps)),
        left 0.3s steps(var(--quantum-GuideStrong-steps)),
        top 0.3s steps(var(--quantum-GuideStrong-steps));
    }
  }

  .on-mask {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }
}

@keyframes fadeIn {
  from {
    box-shadow: 0 0 0 2000px rgba(0, 0, 0, 0);
  }
  to {
    box-shadow: 0 0 0 2000px rgba(0, 0, 0, 0.85);
  }
}
</style>
