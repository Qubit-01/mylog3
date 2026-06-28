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
        <component :is="t.component" />
      </SwiperSlide>
    </Swiper>
    <RouterView v-else class="main page" />
    <TabBar />
  </div>
</template>

<style lang="scss" scoped>
.default {
  height: 100dvh;
  overflow: hidden;

  > .main {
    height: 100%;
  }

  .page {
    overflow-y: auto;
  }
}
</style>
