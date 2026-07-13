<script lang="ts" setup>
/** 默认布局：Tab 页走横向 Swiper，非 Tab 页走普通 RouterView，底部统一 TabBar */
import { Swiper, SwiperSlide } from 'swiper/vue'
import 'swiper/css'
import { tabs } from './(default)/tabs'

const route = useRoute()
const router = useRouter()

/** 当前路径对应的 Tab 索引，-1 表示不在 Tab 列表里（走 RouterView 分支） */
const index = computed(() => tabs.findIndex((t) => t.to === route.path))

/** swiper 实例 ref，用于响应路由变化命令式切页 */
const swiper = shallowRef<{ slideTo: (i: number) => void }>()
watch(index, (i) => i >= 0 && swiper.value?.slideTo(i))

/**
 * 已挂载过的 tab 索引集合，实现按需懒挂载：未访问的 slide 保持空壳，
 * 避免未登录时 `mine` 等受保护页面被提前挂载并触发接口
 */
const mounted = reactive(new Set<number>())
watch(index, (i) => i >= 0 && mounted.add(i), { immediate: true })
</script>

<template>
  <div class="default">
    <Swiper
      v-if="index >= 0"
      class="main"
      :initial-slide="index"
      @swiper="(s) => (swiper = s)"
      @slide-change="(s) => router.replace(tabs[s.activeIndex].to)"
    >
      <SwiperSlide v-for="(t, i) in tabs" :key="t.to" class="page">
        <component :is="t.component" v-if="mounted.has(i)" />
      </SwiperSlide>
    </Swiper>
    <RouterView v-else class="main page" />
    <!-- 全局侧边栏：布局级单例，独立于各 tab 页面 -->
    <aside class="aside">
      <AsideUser />
    </aside>
    <TabBar />
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
