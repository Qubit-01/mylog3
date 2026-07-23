<script lang="ts" setup>
/** 底部悬浮 Tab 导航栏 */
import { tabs } from '../pages/(default)/tabs'

const { extra } = defineProps<{
  /** 是否显示附属页圆形 item */
  extra: boolean
}>()
const route = useRoute()
/** 当前路由对应的 item 索引；附属页固定排在主 Tab 之后 */
const activeIndex = computed(() => {
  const index = tabs.findIndex((t) => t.to === route.path)
  return index < 0 ? tabs.length : index
})
</script>

<template>
  <div class="TabBar" :class="{ extra }">
    <div class="indicator" />

    <RouterLink v-for="t in tabs" :key="t.to" :to="t.to" class="item">
      {{ t.label }}
    </RouterLink>
    <span v-if="extra" class="extra">
      <span class="dot" />
    </span>
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
