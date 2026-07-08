<script lang="ts" setup>
/** 底部悬浮 Tab 导航栏 */
import { tabs } from '../pages/(default)/tabs'

const route = useRoute()
/** 当前激活 tab 的索引，-1 表示无匹配 */
const activeIndex = computed(() => tabs.findIndex((t) => t.to === route.path))
</script>

<template>
  <div class="TabBar">
    <div v-show="activeIndex >= 0" class="indicator" />

    <RouterLink v-for="t in tabs" :key="t.to" :to="t.to" class="item">
      {{ t.label }}
    </RouterLink>
  </div>
</template>

<style lang="scss" scoped>
.TabBar {
  --active: v-bind(activeIndex);
  --count: v-bind('tabs.length');

  position: fixed;
  left: 50%;
  bottom: calc(env(safe-area-inset-bottom) + 16px);
  transform: translateX(-50%);
  z-index: 10;
  display: flex;
  gap: 4px;
  padding: 6px;
  overflow: hidden;
  border-radius: 999px;
  background: #fff9;
  backdrop-filter: blur(8px) saturate(180%);
  -webkit-backdrop-filter: blur(8px) saturate(180%);
  box-shadow:
    inset 0 0 0 1px #0001,
    0 6px 24px #0002;

  > .indicator {
    position: absolute;
    top: 6px;
    bottom: 6px;
    left: 6px;
    width: calc((100% - 12px - 4px * (var(--count) - 1)) / var(--count));
    transform: translateX(calc((100% + 4px) * var(--active)));
    transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    background: #07fe;
    border-radius: 999px;
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
    text-shadow: 0 1px 2px #fff9;
    font-size: 14px;
    font-weight: 700;
    text-decoration: none;
    transition: color 0.25s;
    &.router-link-exact-active {
      color: #fff;
      text-shadow: 0 1px 2px #0005;
    }
  }
}
</style>
