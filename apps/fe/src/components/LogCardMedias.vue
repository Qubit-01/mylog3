<script lang="ts" setup>
/** Log 媒体画廊：单行平铺，点击后进入图片 / 视频混合预览 */
import type { LogMedia } from '@/api'
import { Close, VideoPlay } from '@element-plus/icons-vue'
import { Swiper, SwiperSlide } from 'swiper/vue'
import { Keyboard, Navigation, Pagination } from 'swiper/modules'
import type { Swiper as SwiperInstance } from 'swiper/types'
import PictureImg from 'shared/PictureImg'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'

const props = defineProps<{
  /** 图片 + 视频混排列表，元素形态 `{ type, url }` */
  medias: LogMedia[]
}>()

/**
 * 把资源引用转成可访问地址
 * @param url 完整 URL 或 COS object key
 * @returns 可直接用于 src 的访问地址
 */
const toResourceUrl = (url: string) => {
  if (url.startsWith('http://')) return url.replace('http://', 'https://')
  if (url.startsWith('https://')) return url
  return `https://cos.mylog.ink/${url}`
}

/** 补全后的可展示媒体，保留后端原始顺序 */
const medias = computed(() =>
  props.medias.map((media) => ({ ...media, url: toResourceUrl(media.url) })),
)

/** 当前预览下标，undefined 表示关闭预览 */
const current = ref<number>()
/** Swiper 功能模块 */
const modules = [Keyboard, Navigation, Pagination]

/** 预览时只加载当前项及相邻项，避免打开预览后一次性请求所有原图 / 视频 */
const shouldLoad = (index: number) =>
  current.value !== undefined && Math.abs(index - current.value) <= 1

/** 切换预览项时同步当前下标，并暂停离开的 video */
const onSlideChange = (swiper: SwiperInstance) => {
  current.value = swiper.activeIndex
  for (const video of swiper.el.querySelectorAll('video')) video.pause()
}

useEventListener('keyup', (event: KeyboardEvent) => {
  if (event.key === 'Escape') current.value = undefined
})
</script>

<template>
  <div v-if="medias.length" class="LogCardMedias swiper-no-swiping">
    <div class="medias">
      <button
        v-for="(media, i) in medias"
        :key="media.url"
        class="item"
        type="button"
        @click="current = i"
      >
        <PictureImg
          v-if="media.type === 'image'"
          :src="media.url.replace('/imgs/', '/compress-imgs/')"
          lazy
        />
        <template v-else>
          <PictureImg
            :src="`${media.url}?ci-process=snapshot&time=0&format=jpg`"
            lazy
          />
          <ElIcon class="play"><VideoPlay /></ElIcon>
        </template>
      </button>
    </div>

    <Teleport to="body">
      <div
        v-if="current !== undefined"
        class="preview"
        @click.self="current = undefined"
      >
        <ElButton
          class="close"
          :icon="Close"
          circle
          text
          @click.stop="current = undefined"
        />
        <Swiper
          class="swiper"
          :modules="modules"
          :initial-slide="current"
          :keyboard="{ enabled: true }"
          navigation
          pagination
          @slide-change="onSlideChange"
        >
          <SwiperSlide
            v-for="(media, i) in medias"
            :key="media.url"
            class="slide"
            @click.self="current = undefined"
          >
            <img
              v-if="media.type === 'image' && shouldLoad(i)"
              :src="media.url"
            />
            <video
              v-else-if="shouldLoad(i)"
              :src="media.url"
              :poster="`${media.url}?ci-process=snapshot&time=0&format=jpg`"
              controls
              playsinline
            />
          </SwiperSlide>
        </Swiper>
      </div>
    </Teleport>
  </div>
</template>

<style lang="scss" scoped>
.LogCardMedias {
  --size: 96px;

  > .medias {
    display: flex;
    flex-flow: row nowrap;
    gap: 4px;
    overflow-x: auto;
    overscroll-behavior-inline: contain;
    scrollbar-width: none;

    &::-webkit-scrollbar {
      display: none;
    }
  }

  .item {
    position: relative;
    flex: 0 0 var(--size);
    width: var(--size);
    height: var(--size);
    padding: 0;
    overflow: hidden;
    background: var(--el-fill-color-light);
    border: 0;
    border-radius: 6px;
    cursor: pointer;

    > .PictureImg,
    > video {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    > .PictureImg {
      :deep(img) {
        object-fit: cover;
      }
    }

    > .play {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      color: #fffe;
      font-size: 28px;
      background: #0003;
    }
  }
}

.preview {
  position: fixed;
  z-index: 3000;
  inset: 0;
  display: flex;
  background: #0006;

  > .close {
    position: fixed;
    z-index: 3001;
    top: 16px;
    right: 20px;
    color: #fff;
    font-size: 24px;
  }

  > .swiper {
    width: 100%;
    height: 100%;
  }

  .slide {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 56px;

    > img,
    > video {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }
  }
}
</style>
