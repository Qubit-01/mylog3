<!-- 场景：Hover 目标元素时显示 -->
<script lang="ts" setup>
import { ref, onMounted, watch } from 'vue'
import type { Placement, UseFloatingOptions } from '@floating-ui/vue'
import type { Relate } from './utils'
import Floating from './index.vue'

const props = defineProps<{
  /** 默认找同级前一个兄弟元素，传入 parent 找父元素，也可以直接传入元素 */
  relate?: Relate
  /** 弹出框的定位方式 */
  placement?: Placement
  /** floating UI options, 上面的 placement 其实可以从这里传入 */
  options?: UseFloatingOptions
  /** 只对参考元素 hover 事件不让其消失 */
  hoverOnly?: boolean
  /** 延迟消失时间，默认不延迟，当浮起元素和参考元素有间距时 */
  delay?: number
}>()

const emits = defineEmits<{
  /** 浮动元素显示前执行 */
  beforeShow: []
}>()

const $Floating = ref<InstanceType<typeof Floating>>()

// 真正的show，因为要设置延迟
const showReal = ref(false)
watch(showReal, (val) => {
  if (val) emits('beforeShow')
})

// 参考元素是否悬停
const referenceHovering = ref(false)
// 浮动元素是否悬停
const floatHovering = ref(false)

// 如果show变为false，要处理延迟消失
let delayTimer: ReturnType<typeof setTimeout> | undefined

watch(referenceHovering, (val) => {
  clearTimeout(delayTimer)
  // 如果是消失且延迟
  if (!val && props.delay) {
    // 如果有延迟消失，就设置定时器
    delayTimer = setTimeout(() => {
      showReal.value = false
    }, props.delay)
    return
  }
  // 如果没有延迟消失，就直接同步
  showReal.value = val
})

watch(floatHovering, (val) => {
  if (!props.hoverOnly) {
    clearTimeout(delayTimer)
    // 如果是消失且延迟
    if (!val && props.delay) {
      // 如果有延迟消失，就设置定时器
      delayTimer = setTimeout(() => {
        showReal.value = false
      }, props.delay)
      return
    }
    // 如果没有延迟消失，就直接同步
    showReal.value = val
  }
})

// 给父元素加 hover 事件
onMounted(() => {
  if (!$Floating.value?.reference || !$Floating.value?.$el) return

  // 给元素添加 hover 事件
  $Floating.value.reference.addEventListener('pointerenter', () => {
    referenceHovering.value = true
  })
  $Floating.value.reference.addEventListener('pointerleave', () => {
    referenceHovering.value = false
  })

  // 给浮动元素添加 hover 事件
  $Floating.value.$el.addEventListener('pointerenter', () => {
    floatHovering.value = true
  })
  $Floating.value.$el.addEventListener('pointerleave', () => {
    floatHovering.value = false
  })
})

defineExpose({ showReal })
</script>

<template>
  <Floating
    ref="$Floating"
    v-model:show="showReal"
    class="ToolTip"
    :relate="relate"
    :placement="placement"
    :options="options"
  >
    <slot />
  </Floating>
</template>

<style lang="scss" scoped>
.ToolTip {
  z-index: 1;
}
</style>
