import imageCompression from 'browser-image-compression'
import imageCompressionWorkerUrl from 'browser-image-compression/dist/browser-image-compression.js?url'
import { parseImageThumbnail } from 'shared/exifr'

/**
 * 为支持的图片生成列表轻量预览，元数据由未经处理的原图保留。
 * @param file 用户选择的原始文件，不会被修改
 * @returns 压缩后的预览文件；不支持压缩的格式返回 undefined
 */
export const compressImage = (file: File) => {
  if (
    !['image/jpeg', 'image/png', 'image/webp', 'image/bmp'].includes(file.type)
  ) {
    return undefined
  }

  return imageCompression(file, {
    maxSizeMB: 0.5,
    maxWidthOrHeight: 512,
    initialQuality: 0.85,
    preserveExif: false,
    useWebWorker: true,
    libURL: imageCompressionWorkerUrl,
  })
}

/**
 * 为图片生成上传预览，优先复用 EXIF 内嵌缩略图，缺失时再压缩原图。
 * @param file 用户选择的原始图片，不会被修改
 * @returns EXIF 缩略图文件或压缩后的预览文件；不支持压缩且无缩略图时返回 undefined
 */
export const generateImagePreview = async (file: File) => {
  const thumbnail = await parseImageThumbnail(file)
  return thumbnail
    ? new File([new Uint8Array(thumbnail)], `${file.name}.jpg`, {
        type: 'image/jpeg',
        lastModified: file.lastModified,
      })
    : compressImage(file)
}
