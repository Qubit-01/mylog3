<!--
TabBar：
- 展示默认布局当前可见的 Tab 及附属页状态。
-->
<script lang="ts" setup>
import { useTabs } from '../pages/(default)/tabs'

const { tabs, index } = useTabs()
/** 当前是否为 Tab 之外的通用附属页 */
const extra = computed(() => index.value >= tabs.value.length)
</script>

<template>
  <div class="TabBar" :class="{ extra }">
    <div class="indicator" />

    <RouterLink
      v-for="t in tabs"
      :key="t.to.path"
      :to="t.to"
      class="item"
      replace
    >
      {{ t.label }}
    </RouterLink>
    <span v-if="extra" class="extra">
      <span class="dot" />
    </span>
  </div>
</template>

<style lang="scss" scoped>
.TabBar {
  --active: v-bind(index);
  --count: v-bind('tabs.length');

  position: fixed;
  left: 50%;
  bottom: calc(env(safe-area-inset-bottom) + 16px);
  transform: translateX(-50%);
  z-index: 10;
  display: flex;
  gap: 4px;
  width: calc(68px * var(--count) + 8px);
  padding: 6px;
  overflow: hidden;
  border: 1px solid var(--el-border-color, #dcdfe6);
  border-radius: 999px;
  background: var(--el-bg-color, #fff);
  background: color-mix(in srgb, var(--el-bg-color, #fff) 80%, transparent);
  backdrop-filter: blur(8px) saturate(180%);
  -webkit-backdrop-filter: blur(8px) saturate(180%);
  box-shadow: 0 6px 24px #0002;
  transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);

  &.extra {
    width: calc(68px * var(--count) + 52px);

    > .indicator {
      width: 40px;
    }
  }

  > .indicator {
    position: absolute;
    top: 6px;
    bottom: 6px;
    left: 6px;
    width: 64px;
    transform: translateX(calc(68px * var(--active)));
    transition:
      width 0.4s cubic-bezier(0.4, 0, 0.2, 1),
      transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    background: var(--el-color-primary, #409eff);
    border-radius: 999px;
  }

  > .item,
  > .extra {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 40px;
  }

  > .item {
    flex: 0 0 64px;
    padding: 0 16px;
    color: var(--el-text-color-primary, #303133);
    font-size: 14px;
    font-weight: 700;
    text-decoration: none;
    transition: color 0.25s;

    &.router-link-exact-active {
      color: #fff;
    }
  }

  > .extra {
    flex: 0 0 40px;

    > .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #fff;
    }
  }
}
</style>
