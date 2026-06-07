<script lang="ts" setup>
import { ref, onMounted } from 'vue'

defineProps<{
  /** 宽高比例，支持格式：[16,9] 或 1.777 */
  ratio: [number, number] | number
}>()

// 浏览器是否支持 aspect-ratio
const modern = ref(false)

onMounted(() => {
  modern.value = CSS.supports('aspect-ratio', '1/1')
})
</script>

<template>
  <!-- 现代浏览器方案 -->
  <div
    v-if="modern"
    class="aspect-div"
    :style="{
      aspectRatio: Array.isArray(ratio) ? `${ratio[0]} / ${ratio[1]}` : ratio,
    }"
  >
    <slot />
  </div>
  <!-- 传统浏览器方案 -->
  <div
    v-else
    class="aspect-div legacy"
    :style="{
      '--aspect-padding': Array.isArray(ratio)
        ? `${(ratio[1] / ratio[0]) * 100}%`
        : `${ratio * 100}%`,
    }"
  >
    <div class="inner">
      <slot />
    </div>
  </div>
</template>

<style lang="scss" scoped>
/* 传统方案专用样式 */
.legacy {
  position: relative;

  &::before {
    content: '';
    display: block;
    padding-top: var(--aspect-padding);
  }

  > .inner {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }
}
</style>
