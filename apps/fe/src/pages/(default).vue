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
watch(index, (i) => swiper.value?.slideTo(i))
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
      <SwiperSlide v-for="t in tabs" :key="t.to" class="page">
        <div class="slot">
          <component :is="t.component" />
        </div>
      </SwiperSlide>
    </Swiper>
    <RouterView v-else class="main page" />
    <!-- 全局侧边栏：布局级单例，独立于各 tab 页面 -->
    <aside class="aside">Aside</aside>
    <TabBar />
  </div>
</template>

<style lang="scss" scoped>
/** slot（内容主区）最大宽度 */
$slot-max-width: 768px;
/** Aside 栏宽度 */
$aside-width: 120px;
/** Aside 与 slot 之间、以及 Aside 距视口左边的间距 */
$aside-gap: 16px;

.default {
  height: 100dvh;
  overflow: hidden;

  > .main {
    height: 100%;
  }

  .page {
    display: flex;
    justify-content: center;
    overflow-y: auto;
  }

  // 内容宽度限制层：默认铺满，大屏（断点内）限宽居中
  .slot {
    width: 100%;
    max-width: 100%; // 显式初值以便断点切换时能 transition（max-width: none 无法插值）
    min-height: 100%; // 内容短时铺满视口，内容长时被撑开
    transition: max-width 0.3s;
    background: #0002;
  }

  // 全局 Aside：固定视口，左边紧贴 slot 居中后左侧外缘
  > .aside {
    position: fixed;
    z-index: 1;
    top: 0;
    left: calc(50% - #{$slot-max-width * 0.5 + $aside-width + $aside-gap});
    width: $aside-width;
    display: none;
    background: #0002;
  }

  // 视口能同时容下 slot 及两侧 aside+gap 时才限宽并显示 Aside
  @media (min-width: #{$slot-max-width + 2 * ($aside-width + $aside-gap)}) {
    .slot {
      max-width: $slot-max-width;
    }
    > .aside {
      display: block;
    }
  }
}
</style>
