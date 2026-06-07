import type { ImgHTMLAttributes } from 'vue'

/** 一种需要兼容的fallback图像类型（历史需要）有可能会传入这种类型的图像 */
export type FallbackPicture = {
  fallback: { src: string; w?: number } & ImgHTMLAttributes
  sources: {
    // avif: [{src: 'xxx.avif'}], webp: [{src: xx.webp}]
    [key: string]: { src: string; w?: number }[]
  }
}
