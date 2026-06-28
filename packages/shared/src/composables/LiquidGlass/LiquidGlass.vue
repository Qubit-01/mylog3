<script lang="ts" setup>
/**
 * 液态玻璃容器：仿 iOS 26 Liquid Glass
 * - 只提供默认毛玻璃 + 液态扭曲外观，外部用 :deep(.LiquidGlass) { ... } 覆盖任意 CSS 即可
 * - SVG 滤镜由组件按需注入到 body，全局只挂一份，零侵入
 *
 * @example
 * <LiquidGlass>内容</LiquidGlass>
 *
 * 自定义样式（外部 scoped 样式里）：
 *   :deep(.LiquidGlass) {
 *     background: rgba(0, 122, 255, .95);
 *     border-radius: 16px;
 *     backdrop-filter: blur(10px) saturate(180%); // 覆盖即可关掉液态扭曲
 *   }
 */

/** 单例守卫：标记全局 SVG 滤镜是否已挂载 */
const shouldMountFilter = ref(false)
onMounted(() => {
  if (!document.getElementById('liquid-glass-filter'))
    shouldMountFilter.value = true
})
</script>

<template>
  <div class="LiquidGlass">
    <slot />

    <!-- 全局液态扭曲 SVG 滤镜，单例注入到 body -->
    <Teleport v-if="shouldMountFilter" to="body">
      <svg width="0" height="0" aria-hidden="true" style="position: absolute">
        <filter id="liquid-glass-filter">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.01"
            numOctaves="1"
            seed="5"
            result="noise"
          />
          <feGaussianBlur in="noise" stdDeviation="3" result="map" />
          <feDisplacementMap
            in="SourceGraphic"
            in2="map"
            scale="80"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </svg>
    </Teleport>
  </div>
</template>

<style lang="scss" scoped>
.LiquidGlass {
  position: relative;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.35);
  border-radius: 999px;
  backdrop-filter: url(#liquid-glass-filter) blur(6px) saturate(180%);
  -webkit-backdrop-filter: url(#liquid-glass-filter) blur(6px) saturate(180%);
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.5),
    0 6px 24px rgba(0, 0, 0, 0.15);
}
</style>
