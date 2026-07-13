<script lang="ts" setup>
/** 媒体轮播：按结构类型展示图片与视频，并控制相邻资源加载 */
import { Keyboard, Mousewheel, Navigation, Pagination } from 'swiper/modules'
import type { Swiper as SwiperInstance } from 'swiper/types'
import { Swiper, SwiperSlide } from 'swiper/vue'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'

const { medias, initialSlide = 0 } = defineProps<{
  /** 图片与视频混排列表；previewUrl 可用于生成视频封面 */
  medias: {
    /** 媒体类型 */
    type: 'image' | 'video'
    /** 原始资源的完整 URL 或 COS object key */
    url: string
    /** 可选的轻量预览资源 URL 或 COS object key */
    previewUrl?: string
  }[]
  /** 初始展示项下标，默认从第一项开始 */
  initialSlide?: number
}>()

const emit = defineEmits<{
  /** 点击幻灯片空白区域 */
  backgroundClick: []
}>()

/** Swiper 键盘、横向滚动、导航与分页模块 */
const modules = [Keyboard, Mousewheel, Navigation, Pagination]
/** 当前展示项下标，用于限制原图与视频的加载范围 */
const current = ref(initialSlide)

/**
 * 把资源引用转成可访问地址
 * @param url 完整 URL 或 COS object key
 * @returns 可直接用于 src 的 HTTPS 地址
 */
const toResourceUrl = (url: string) => {
  if (url.startsWith('http://')) return url.replace('http://', 'https://')
  if (url.startsWith('https://')) return url
  return `https://cos.mylog.ink/${url}`
}

/** 只加载当前项及相邻项，避免一次性请求所有原图与视频 */
const shouldLoad = (index: number) => Math.abs(index - current.value) <= 1

/** 切换媒体时同步当前下标，并暂停离开的所有视频 */
const onSlideChange = (swiper: SwiperInstance) => {
  current.value = swiper.activeIndex
  for (const video of swiper.el.querySelectorAll('video')) video.pause()
}
</script>

<template>
  <Swiper
    class="MediaSwiper"
    :modules="modules"
    :initial-slide="initialSlide"
    keyboard
    :mousewheel="{ forceToAxis: true }"
    :navigation="medias.length > 1"
    :pagination="medias.length > 1 ? { clickable: true } : false"
    @slide-change="onSlideChange"
  >
    <SwiperSlide
      v-for="(media, i) in medias"
      :key="media.url"
      class="slide"
      @click.self="emit('backgroundClick')"
    >
      <img
        v-if="media.type === 'image' && shouldLoad(i)"
        :src="toResourceUrl(media.url)"
      />
      <video
        v-else-if="shouldLoad(i)"
        :src="toResourceUrl(media.url)"
        :poster="`${toResourceUrl(media.previewUrl ?? media.url)}?ci-process=snapshot&time=0&format=jpg`"
        controls
        playsinline
        preload="none"
      />
    </SwiperSlide>
  </Swiper>
</template>

<style lang="scss" scoped>
.MediaSwiper {
  width: 100%;
  height: 100%;

  .slide {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--media-swiper-padding, 0);

    > img,
    > video {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }
  }
}
</style>
