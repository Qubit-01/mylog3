<!--
DefaultLayout：
- 使用横向 Swiper 承载主 Tab 和通用附属页。
- 统一展示全局侧边栏和底部 TabBar。
-->
<script lang="ts" setup>
import type { Swiper as SwiperType } from 'swiper/types'
import { Swiper, SwiperSlide } from 'swiper/vue'
import 'swiper/css'
import { tabs } from './(default)/tabs'

const route = useRoute()
const router = useRouter()

/** 当前路由对应的 Slide 索引；非主 Tab 路由统一落到末尾附属页 */
const index = computed(() => {
  const i = tabs.findIndex((t) => t.to === route.path)
  return i < 0 ? tabs.length : i
})

/** swiper 实例 ref，用于响应路由变化命令式切页 */
const swiper = shallowRef<SwiperType>()

/** 路由变化后等待附属 Slide 增删完成，再更新 Swiper 并切页 */
watch(index, async (i) => {
  await nextTick()
  swiper.value?.update()
  swiper.value?.slideTo(i)
})

/**
 * 手势滑动结束后同步路由；路由驱动的滑动不反向改写路由。
 * @returns 无返回值，仅同步当前路由
 */
const onSlideChange = (instance: SwiperType) => {
  const to = tabs[instance.activeIndex]?.to
  if (to && instance.previousIndex === index.value) router.replace(to)
}

/**
 * 已挂载过的 tab 索引集合，实现按需懒挂载：未访问的 slide 保持空壳，
 * 避免未登录时 `mine` 等受保护页面被提前挂载并触发接口
 */
const mounted = reactive(new Set<number>())
watch(index, (i) => i < tabs.length && mounted.add(i), { immediate: true })
</script>

<template>
  <div class="default">
    <Swiper
      class="main"
      :initial-slide="index"
      @swiper="(s) => (swiper = s)"
      @slide-change-transition-end="onSlideChange"
    >
      <SwiperSlide v-for="(t, i) in tabs" :key="t.to" class="page">
        <component :is="t.component" v-if="mounted.has(i)" />
      </SwiperSlide>
      <!-- 通用附属页：非主 Tab 子路由只需正常跳转，无须修改布局 -->
      <SwiperSlide v-if="index >= tabs.length" class="page">
        <RouterView />
      </SwiperSlide>
    </Swiper>
    <!-- 全局侧边栏：布局级单例，独立于各 tab 页面 -->
    <aside class="aside">
      <AsideUser />
    </aside>
    <TabBar :extra="index >= tabs.length" />
  </div>
</template>

<style lang="scss" scoped>
/** 内容主区最大宽度 */
$content-max-width: 768px;
/** Aside 栏宽度 */
$aside-width: 120px;
/** Aside 与内容主区之间的间距，同时也是内容 padding 与 aside 顶端对齐值 */
$aside-gap: 12px;

.default {
  --content-max-width: 100%;

  height: 100dvh;
  overflow: hidden;

  > .main {
    height: 100%;
  }

  .page {
    overflow: hidden;
  }

  // 全局 Aside：固定视口，左边紧贴内容主区居中后左侧外缘
  // top 与页面 padding 保持一致，让 aside 首个模块与首条 log 视觉对齐
  > .aside {
    position: fixed;
    z-index: 1;
    top: $aside-gap;
    left: calc(50% - #{$content-max-width * 0.5 + $aside-width + $aside-gap});
    width: $aside-width;
    display: none;
  }

  // 视口能同时容下内容主区及两侧 aside+gap 时才限宽并显示 Aside
  @media (min-width: #{$content-max-width + 2 * ($aside-width + $aside-gap)}) {
    --content-max-width: #{$content-max-width};

    > .aside {
      display: block;
    }
  }
}
</style>

<style lang="scss">
/** 默认布局页面统一使用的内容滚动容器 */
.default-scrollbar {
  height: 100%;

  > .wrap {
    display: flex;
    justify-content: center;
    align-items: flex-start;
    overscroll-behavior: contain;

    > .view {
      display: flex;
      flex-direction: column;
      gap: 8px;
      width: 100%;
      max-width: var(--content-max-width);
      padding: 12px;
      // 底部悬浮 TabBar 占位，避免最后一项内容被挡住
      padding-bottom: calc(env(safe-area-inset-bottom) + 100px);
      transition: max-width 0.3s;
    }
  }
}
</style>
