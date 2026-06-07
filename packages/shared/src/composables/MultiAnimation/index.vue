<!-- 
 MultiAnimation

 1. 只能用 animation: none 来清除动画，不能用 paused
    避免 backwards 在根元素上应用动效第一帧
 2. 只能用 style 来应用1 ，不能用 class 切换
    避免 MutationObserver 循环触发
-->
<script lang="ts" setup>
import { ref, watch, computed, defineProps, nextTick } from 'vue'
import AnimationItem from './AnimationItem.vue'

const props = defineProps<{
  /**
   * 如果元素动画的可能会在播放中改变，就启用这个
   * 比如会通过修改 class 来切换动画，启用了就会监听属性变化并更新动画列表
   * 传入 number，表示动效的数量，这是为了避免频繁的 DOM 计算开销
   */
  enabledObserver?: number
}>()

const $Root = ref<HTMLDivElement | null>(null)
// 原始动画字符串
const animsComputed = ref<string>('')
// 动画清除标记，这里只能用 style 属性实现 none
const animNone = ref(false)

// 更新动画列表
const updateAnimsComputed = async () => {
  animNone.value = false
  await nextTick()
  if (!$Root.value) return
  animsComputed.value = getComputedStyle($Root.value).animation
  animNone.value = true // 读取完后重置根节点
}

// 1. 初始调用，observe 只在属性变化时触发
watch($Root, updateAnimsComputed)

// 2. 可选的属性变化监听器
const observer = props.enabledObserver
  ? new MutationObserver(updateAnimsComputed)
  : null
watch($Root, (el) => {
  if (!el || !observer) return
  observer.observe(el, { attributes: true, attributeFilter: ['class'] }) // 不能监听 style
  return () => observer.disconnect()
})

// 和 dom 节点绑定的动画列表
const anims = computed<string[]>(() => {
  // 解析多个动画（用逗号分隔）
  // 简单分割（实际可能需要更复杂的解析处理括号内的逗号）
  const anims = animsComputed.value
    .split(/,(?![^(]*\))/)
    .map((s) => s.trim())
    .filter((s) => !s.startsWith('none'))
  // 填充数据，保证 dom 结构一致
  while (anims.length < (props.enabledObserver || 0)) {
    anims.push('')
  }
  return anims
})
</script>

<template>
  <div
    ref="$Root"
    class="MultiAnimation"
    :style="animNone ? { animation: 'none' } : {}"
  >
    <AnimationItem :animations="anims">
      <slot />
    </AnimationItem>
  </div>
</template>

<style lang="scss" scoped></style>
