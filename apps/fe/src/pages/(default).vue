<script lang="ts" setup>
/** 默认布局：Tab 页走横向 Swiper，非 Tab 页走普通 RouterView，底部统一 TabBar */
import { Swiper, SwiperSlide } from 'swiper/vue'
import 'swiper/css'
import { tabs } from './(default)/tabs'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()

/** 当前路径对应的 Tab 索引，-1 表示不在 Tab 列表里（走 RouterView 分支） */
const index = computed(() => tabs.findIndex((t) => t.to === route.path))

/** swiper 实例 ref，用于响应路由变化命令式切页 */
const swiper = shallowRef<{ slideTo: (i: number) => void }>()
watch(index, (i) => swiper.value?.slideTo(i))

/** 当前登录用户，用于 Aside 展示 */
const { user } = storeToRefs(useUserStore())
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
    <aside class="aside">
      <div v-if="user" class="user-card">
        <ElAvatar :src="user.avatar ?? undefined" :size="56">
          {{ user.name.slice(0, 1) }}
        </ElAvatar>
        <div class="name" @click="router.push('/profile')">
          {{ user.name }}
        </div>
        <ElButton type="primary" round @click="router.push('/mine')">
          去写一篇
        </ElButton>
      </div>
    </aside>
    <TabBar />
  </div>
</template>

<style lang="scss" scoped>
/** slot（内容主区）最大宽度 */
$slot-max-width: 768px;
/** Aside 栏宽度 */
$aside-width: 120px;
/** Aside 与 slot 之间的间距，同时也是 slot 内容 padding 与 aside 顶端对齐值 */
$aside-gap: 12px;

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
    // background: #0002;
  }

  // 全局 Aside：固定视口，左边紧贴 slot 居中后左侧外缘
  // top 与页面 padding 保持一致，让 aside 首个模块与 slot 首条 log 视觉对齐
  > .aside {
    position: fixed;
    z-index: 1;
    top: $aside-gap;
    left: calc(50% - #{$slot-max-width * 0.5 + $aside-width + $aside-gap});
    width: $aside-width;
    display: none;

    .user-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 12px;
      background: var(--el-bg-color-overlay);
      border: 1px solid var(--el-border-color-lighter);
      border-radius: 8px;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);

      > .name {
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;

        &:hover {
          color: var(--el-color-primary);
        }
      }
    }
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
