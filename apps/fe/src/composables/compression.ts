import imageCompression from 'browser-image-compression'
import imageCompressionWorkerUrl from 'browser-image-compression/dist/browser-image-compression.js?url'

/**
 * 为支持的图片生成列表轻量预览，JPEG 会尽量保留 EXIF。
 * @param file 用户选择的原始文件，不会被修改
 * @returns 压缩后的预览文件；不支持压缩的格式返回 undefined
 */
export const compressImagePreview = (file: File) => {
  if (
    !['image/jpeg', 'image/png', 'image/webp', 'image/bmp'].includes(file.type)
  ) {
    return undefined
  }

  return imageCompression(file, {
    maxSizeMB: 0.5,
    maxWidthOrHeight: 512,
    initialQuality: 0.85,
    preserveExif: true,
    useWebWorker: true,
    libURL: imageCompressionWorkerUrl,
  })
}
