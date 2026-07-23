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

const props = defineProps<{
  /**
   * 图片地址 或 由 vite-imagetools 生成的图像类型
   * @see https://github.com/JonasKruckenberg/imagetools/blob/main/docs/interfaces/core_src.Picture.md
   * ```js
   * { // vite-imagetools 生成的图片对象例子
   *   img: {src: '/@imagetools/19b8f0e7a78', w: 5304, h: 7952}
   *   sources: {avif: '/@imagetools/6165531 5304w', webp: '/@imagetools/58dbfda 5304w'}
   * }
   * ```
   */
  src: string | Picture
  /** 图片加载失败时显示的图片 */
  fallbackSrc?: string
  /** 错误重试次数，默认不重试，每次重试间隔 1s */
  retry?: number
  /**
   * 懒加载，如果传入true，就用原生 img.loading，若不支持原生懒加载，则使用 IntersectionObserver
   * 如果传入了配置项，就直接用 IntersectionObserver，可以进行更精细化的控制，如 { rootMargin: '0px 50px 50px 0px', delay: 500 }
   * @see https://developer.mozilla.org/zh-CN/docs/Web/API/HTMLImageElement/loading
   * @see https://developer.mozilla.org/zh-CN/docs/Web/API/IntersectionObserver/IntersectionObserver
   */
  lazy?:
    | boolean
    | (IntersectionObserverInit & {
        /** 图片连续进入视口多久后才加载，单位 ms；离开视口会重新计时 */
        delay?: number
      })
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

type BaseImgAttrs = Pick<ImgHTMLAttributes, 'src' | 'loading'>
type InnerPicture = Omit<Picture, 'img'> & { img: BaseImgAttrs }

/** img 基础功能属性 */
const baseAttrs = ref<BaseImgAttrs>({})

/** 统一不同类型 src 为组件内部使用的 Picture 类型 */
const picture = computed<InnerPicture>(() => {
  const p = props.src
  try {
    if (typeof p === 'string') {
      return { img: { src: p }, sources: {} }
    }
    const { w: width, h: height, ...imgRest } = p.img
    return { ...p, img: { ...imgRest, width, height } }
  } catch {
    // badcase: 绕过TS，传入 src = null，导致报错
    console.warn('PictureImg> 解析 src 出错: ', p)
    return { img: { src: '' }, sources: {} }
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
/** 延迟加载计时器，图片提前离开视口时需要取消 */
let lazyTimer: ReturnType<typeof setTimeout> | undefined
onMounted(() => {
  const img = $img.value!
  watch(
    [picture, () => props.lazy],
    ([picture, lazy]) => {
      observer?.disconnect() // 先断开之前的观察者，避免内存泄露
      clearTimeout(lazyTimer)
      lazyTimer = undefined
      // 2. 懒加载
      if (!lazy) {
        // 2.1 lazy=false: 不懒加载
        baseAttrs.value = { ...picture.img }
        return
      }
      if (lazy === true && supportImgLoading) {
        // 2.2 lazy=true 且浏览器支持原生懒加载，就用原生懒加载
        baseAttrs.value = { ...picture.img, loading: 'lazy' }
        return
      }

      // 2.3 lazy={}，或者浏览器不支持原生懒加载，都走 IntersectionObserver
      const { delay = 0, ...observerOptions } = lazy === true ? {} : lazy
      observer = new IntersectionObserver((entries) => {
        // 2.3.1 未持续停留到设定时长就离开视口，不触发图片请求
        if (!entries[entries.length - 1]?.isIntersecting) {
          clearTimeout(lazyTimer)
          lazyTimer = undefined
          return
        }

        // 2.3.2 连续可见时长达标后才挂载 src，并停止后续观察
        if (lazyTimer !== undefined) return
        lazyTimer = setTimeout(
          () => {
            baseAttrs.value = { ...picture.img }
            observer?.disconnect()
            lazyTimer = undefined
          },
          Math.max(0, delay),
        )
      }, observerOptions)
      observer.observe(img)
    },
    { immediate: true },
  )
})

onBeforeUnmount(() => {
  observer?.disconnect()
  clearTimeout(lazyTimer)
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
