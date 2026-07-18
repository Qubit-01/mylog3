<script lang="ts" setup>
/** Log 媒体画廊：单行平铺，点击后进入图片 / 视频混合预览 */
import type { LogMedia } from '@/api'
import { toResourceUrl } from 'shared/cos'
import { Close, VideoPlay } from '@element-plus/icons-vue'
import PictureImg from 'shared/PictureImg'

const { medias } = defineProps<{
  /** 图片 + 视频混排列表，原始资源使用 url，轻量展示资源使用可选 previewUrl */
  medias: LogMedia[]
}>()

/** 当前预览下标，undefined 表示关闭预览 */
const current = ref<number>()

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
          :src="toResourceUrl(media.previewUrl ?? media.url)"
          lazy
        />
        <template v-else>
          <PictureImg
            :src="`${toResourceUrl(media.previewUrl ?? media.url)}?ci-process=snapshot&time=0&format=jpg`"
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
          @click="current = undefined"
        />
        <MediaSwiper
          :medias="medias"
          :initial-slide="current"
          @background-click="current = undefined"
        />
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

    > .PictureImg {
      width: 100%;
      height: 100%;

      :deep(img) {
        object-fit: cover;
      }
    }

    > .play {
      position: absolute;
      bottom: 8px;
      left: 8px;
      color: #fffe;
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

  > .MediaSwiper {
    --media-swiper-padding: 56px;
  }
}
</style>
