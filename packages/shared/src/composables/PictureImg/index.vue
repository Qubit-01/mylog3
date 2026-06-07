<!-- PictureImg组件，同时结果动态对象和网络链接，有bug找 @liaoshiqiang -->
<script lang="ts" setup>
import {
  onMounted,
  onBeforeUnmount,
  computed,
  ref,
  watch,
  type ImgHTMLAttributes,
} from 'vue'
import type { Picture } from 'vite-imagetools'
import type { FallbackPicture } from './utils'

const props = defineProps<{
  /**
   * 图片地址 或 由 vite-imagetools 生成的图像类型
   * @see https://github.com/JonasKruckenberg/imagetools/blob/main/docs/interfaces/core_src.Picture.md
   * @see https://npm.corp.kuaishou.com/-/web/detail/@kwai-explore/picture.vue
   * ```js
   * { // vite-imagetools 生成的图片对象例子
   *   img: {src: '/@imagetools/19b8f0e7a78', w: 5304, h: 7952}
   *   sources: {avif: '/@imagetools/6165531 5304w', webp: '/@imagetools/58dbfda 5304w'}
   * }
   * ```
   */
  src: string | Picture | FallbackPicture
  /** 图片加载失败时显示的图片 */
  fallbackSrc?: string
  /** 错误重试次数，默认不重试，每次重试间隔 1s */
  retry?: number
  /**
   * 懒加载，如果传入true，就用原生 img.loading，若不支持原生懒加载，则使用 IntersectionObserver
   * 如果传入了配置项，就直接用 IntersectionObserver，可以进行更精细化的控制，如 { rootMargin: '0px 50px 50px 0px' }
   * @see https://developer.mozilla.org/zh-CN/docs/Web/API/HTMLImageElement/loading
   * @see https://developer.mozilla.org/zh-CN/docs/Web/API/IntersectionObserver/IntersectionObserver
   */
  lazy?: boolean | IntersectionObserverInit
  /** 直接透传到内部 img 标签上的属性，用于加类名、img事件、原生属性啥的 */
  imgAttrs?: ImgHTMLAttributes
}>()
const emits = defineEmits<{
  /** 加载完成 */
  (event: 'load', e: Event): void
  /** 加载失败，每次错误重试都会执行 */
  (event: 'error', e: Event): void
}>()

const $img = ref<HTMLImageElement>()
/** img 基础功能属性 */
const baseAttrs = ref<ImgHTMLAttributes>({})

/** 统一不同类型 src 为 Picture 类型 */
const picture = computed<Picture>(() => {
  try {
    if (typeof props.src === 'string') {
      return { img: { src: props.src } } as Picture
    } else if ('fallback' in props.src) {
      const fallbackSrc = props.src
      const sources: any = { ...fallbackSrc.sources }
      for (const key in sources) sources[key] = sources[key][0].src
      return { img: fallbackSrc.fallback as Picture['img'], sources } as Picture
    }
    return props.src
  } catch (e) {
    // badcase: 绕过TS，传入 src = null，导致报错
    console.log('PictureImg> 解析 src 出错: ', props.src)
    return { img: { src: '' } } as Picture
  }
})

/// 1. 错误重试
/** 当前重试次数 */
let retryTime = 0
onMounted(() => {
  const img = $img.value
  img?.addEventListener('error', () => {
    if (props.retry && retryTime < props.retry) {
      // 延时重试，避免打爆CDN
      setTimeout(() => {
        retryTime++
        img.src += ''
      }, 1000)
    } else {
      props.fallbackSrc && (img.src = props.fallbackSrc)
    }
  })
})

/// 2. 懒加载
/** 是否支持原生懒加载 */
const supportImgLoading = 'loading' in HTMLImageElement.prototype
/** 观察者，如果lazy传入对象，才会创建这个 */
let observer: IntersectionObserver | null = null
onMounted(() => {
  const img = $img.value!
  watch(
    [picture, () => props.lazy],
    ([picture, lazy]) => {
      observer?.disconnect() // 先断开之前的观察者，避免内存泄露
      // 2. 懒加载
      if (!Boolean(lazy)) {
        // 2.1 lazy=false: 不懒加载
        baseAttrs.value = { ...picture.img }
      } else if (lazy === true && supportImgLoading) {
        // 2.2 lazy=true 且浏览器支持原生懒加载，就用原生懒加载
        baseAttrs.value = { ...picture.img, loading: 'lazy' }
      } else if (typeof lazy === 'object' || !supportImgLoading) {
        // 2.3 lazy={}，或者 浏览器不支持原生懒加载，都走 IntersectionObserver
        observer = new IntersectionObserver(
          (entries) => {
            // 如果元素进入视口，则加载图片，isIntersecting 属性为 false 就是退出
            if (entries[entries.length - 1]?.isIntersecting) {
              baseAttrs.value = { ...picture.img }
              img.src += ''
            }
          },
          typeof lazy === 'object' ? lazy : {},
        )
        observer.observe(img)
      }
    },
    { immediate: true },
  )
})

onBeforeUnmount(() => {
  observer?.disconnect()
})
</script>

<template>
  <picture class="PictureImg">
    <source
      v-for="(srcset, type) in picture.sources"
      :key="type"
      :srcset="srcset"
      :type="`image/${type}`"
    />
    <img
      ref="$img"
      v-bind="{ ...baseAttrs, ...imgAttrs }"
      @load="emits('load', $event)"
      @error="emits('error', $event)"
    />
  </picture>
</template>

<style lang="scss" scoped>
.PictureImg {
  display: flex;

  img {
    display: flex;
    width: 100%;
    height: 100%;
  }
}
</style>
