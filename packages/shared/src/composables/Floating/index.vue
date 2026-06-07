<!-- 场景：全手动控制弹出框的显示与否 -->
<script lang="ts" setup>
import { ref, defineModel, onBeforeUnmount, computed } from 'vue'
import { type Placement, type UseFloatingOptions } from '@floating-ui/vue'
import { useFloatingRelate, type Relate } from './utils'

/** 控制显示与否，组件内外都可以操作 */
const show = defineModel<boolean>('show', { default: true })

const props = defineProps<{
  /**
   * 指定相对元素
   * 不传=传false，默认找同级前一个兄弟元素
   * 传true，找父元素
   * 传元素或选择器，指定元素
   */
  relate?: Relate
  /** 弹出框的定位方式 */
  placement?: Placement
  /** 其他的 floating UI options, 上面的 placement 其实可以从这里传入 */
  options?: UseFloatingOptions
  /** 是否点击外部关闭弹窗 */
  closeOnClickOutside?: boolean
}>()

const relate = computed(() => props.relate)

// 浮起元素
const floating = ref<HTMLDivElement>()
const { reference, floatingStyles, ...rest } = useFloatingRelate(
  floating,
  relate,
  {
    placement: props.placement,
    ...props.options,
  },
)

// 点击外部关闭弹窗
if (props.closeOnClickOutside) {
  const handleClickOutside = (event: PointerEvent) => {
    if (!show.value || !reference.value) return // 如果没有显示就不处理
    const target = event.target as Element
    // 如果点击的是锚点元素就不处理
    if (reference.value.contains(target)) return
    // 判断点击是否发生在弹窗内部
    if (!floating.value?.contains(target)) show.value = false
  }
  // 全局事件监听，点击其他地方关闭弹窗
  document.addEventListener('pointerdown', handleClickOutside)
  onBeforeUnmount(() => {
    document.removeEventListener('pointerdown', handleClickOutside)
  })
}

defineExpose({ show, reference, ...rest })
</script>

<template>
  <div v-if="show" ref="floating" class="Floating" :style="floatingStyles">
    <slot />
  </div>
</template>

<style lang="scss" scoped>
.Floating {
  // z-index: 1;
}
</style>
