<script lang="ts" setup>
/** 底部悬浮 Tab 导航栏：iOS 26 风格，毛玻璃外观委托给 LiquidGlass */
import LiquidGlass from 'shared/LiquidGlass'
import { tabs } from '../pages/(default)/tabs'

const route = useRoute()
/** 当前激活 tab 的索引，-1 表示无匹配 */
const activeIndex = computed(() => tabs.findIndex((t) => t.to === route.path))
</script>

<template>
  <LiquidGlass
    class="TabBar"
    :style="{ '--active': activeIndex, '--count': tabs.length }"
  >
    <!-- 蓝色滑动指示器，也是一片液态玻璃 -->
    <LiquidGlass v-show="activeIndex >= 0" class="indicator" />

    <RouterLink v-for="t in tabs" :key="t.to" :to="t.to" class="item">
      {{ t.label }}
    </RouterLink>
  </LiquidGlass>
</template>

<style lang="scss" scoped>
.TabBar {
  position: fixed;
  left: 50%;
  bottom: calc(env(safe-area-inset-bottom) + 16px);
  transform: translateX(-50%);
  z-index: 10;
  display: flex;
  gap: 4px;
  padding: 6px;

  > .indicator {
    position: absolute;
    top: 6px;
    bottom: 6px;
    left: 6px;
    width: calc((100% - 12px - 4px * (var(--count) - 1)) / var(--count));
    transform: translateX(calc((100% + 4px) * var(--active)));
    transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    background: rgba(0, 122, 255, 0.95);
    backdrop-filter: blur(8px) saturate(180%); // 关闭液态扭曲，文字更清晰
  }

  > .item {
    position: relative;
    z-index: 1;
    display: flex;
    flex: 1;
    align-items: center;
    justify-content: center;
    min-width: 64px;
    height: 40px;
    padding: 0 16px;
    color: #000;
    text-shadow: 0 1px 2px rgba(255, 255, 255, 0.6);
    font-size: 14px;
    font-weight: 700;
    text-decoration: none;
    transition: color 0.25s;
    &.router-link-exact-active {
      color: #fff;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
    }
  }
}
</style>
