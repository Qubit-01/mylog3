import { parse, thumbnail } from '@modernized/exifr'
import { round } from 'lodash-unified'

/**
 * EXIF 解析库返回的目标字段。
 * 官方 `parse` 返回 `Promise<any>`，内部 `Tags` / `GpsOutput` 也未导出，
 * 因此这里只声明当前逻辑实际使用的最小字段集合，避免解析结果退化为 any。
 */
interface ParsedExif {
  /** 原始拍摄时间，不含时区时按相机本地时间理解 */
  DateTimeOriginal?: string
  /** 数字化时间，缺少原始拍摄时间时可作为备选 */
  CreateDate?: string
  /** 原始拍摄时间的 UTC 偏移 */
  OffsetTimeOriginal?: string
  /** 数字化时间的 UTC 偏移 */
  OffsetTimeDigitized?: string
  /** exifr 换算后的十进制纬度 */
  latitude?: number
  /** exifr 换算后的十进制经度 */
  longitude?: number
}

/** EXIF 内嵌缩略图定位字段；两者同时有效时才存在可提取的 JPEG */
interface ParsedThumbnailExif {
  /** 缩略图所在的 IFD1 块 */
  ifd1?: {
    /** 缩略图相对 TIFF 头的字节偏移 */
    ThumbnailOffset?: number
    /** 缩略图字节长度 */
    ThumbnailLength?: number
  }
}

/** 固定选项对象以复用 exifr 内部的解析配置缓存，并保留原始时间字符串 */
const imageExifOptions = {
  pick: [
    'DateTimeOriginal',
    'CreateDate',
    'OffsetTimeOriginal',
    'OffsetTimeDigitized',
    'GPSLatitude',
    'GPSLatitudeRef',
    'GPSLongitude',
    'GPSLongitudeRef',
  ],
  reviveValues: false,
}

/** 固定选项对象以复用 exifr 内部的解析配置缓存，并只读取缩略图定位字段 */
const imageThumbnailOptions = {
  tiff: false,
  ifd1: { pick: ['ThumbnailOffset', 'ThumbnailLength'] },
  mergeOutput: false,
}

/**
 * 解析并归一化图片的拍摄时间和位置。
 * @returns 图片 metadata；没有目标字段或解析失败时返回 undefined
 */
export const parseImageMetadata = async (
  /** 待解析的原始图片文件 */
  file: File,
): Promise<
  | {
      /** 图片拍摄时刻（ISO 8601 UTC 字符串） */
      takenAt?: string
      /** 图片拍摄位置坐标 */
      location?: {
        /** 经度 */
        lng: number
        /** 纬度 */
        lat: number
      }
    }
  | undefined
> => {
  const exif = (await parse(file, imageExifOptions).catch(() => undefined)) as
    ParsedExif | undefined
  if (!exif) return

  let takenAt: string | undefined
  const rawTakenAt = exif?.DateTimeOriginal ?? exif?.CreateDate
  const matchedTakenAt = rawTakenAt?.match(
    /^(\d{4})[:-](\d{2})[:-](\d{2})[ T](\d{2}):(\d{2}):(\d{2}(?:\.\d+)?)/,
  )
  if (matchedTakenAt) {
    const [, year, month, day, hour, minute, second] = matchedTakenAt
    const declaredOffset = exif?.DateTimeOriginal
      ? exif.OffsetTimeOriginal
      : exif?.OffsetTimeDigitized
    const offset = /^[+-]\d{2}:\d{2}$/.test(declaredOffset ?? '')
      ? declaredOffset
      : rawTakenAt?.endsWith(' UTC')
        ? 'Z'
        : ''
    const date = new Date(
      `${year}-${month}-${day}T${hour}:${minute}:${second}${offset}`,
    )
    if (!Number.isNaN(date.getTime())) takenAt = date.toISOString()
  }

  const { latitude, longitude } = exif ?? {}
  // 经纬度最多 3 位整数；保留 12 位小数约等于保留 Number 的 15 位有效数字，仅清理浮点尾噪声
  const location =
    typeof longitude === 'number' &&
    Number.isFinite(longitude) &&
    typeof latitude === 'number' &&
    Number.isFinite(latitude)
      ? {
          lng: round(longitude, 12),
          lat: round(latitude, 12),
        }
      : undefined

  if (!takenAt && !location) return
  return { takenAt, location }
}

/**
 * 读取图片内嵌的 EXIF 缩略图。
 * @returns 缩略图字节；定位字段缺失、无效或读取失败时返回 undefined
 */
export const parseImageThumbnail = async (file: File) => {
  const exif = (await parse(file, imageThumbnailOptions).catch(
    () => undefined,
  )) as ParsedThumbnailExif | undefined
  const { ThumbnailOffset: offset, ThumbnailLength: length } = exif?.ifd1 ?? {}
  if (
    typeof offset !== 'number' ||
    !Number.isSafeInteger(offset) ||
    offset <= 0 ||
    typeof length !== 'number' ||
    !Number.isSafeInteger(length) ||
    length <= 0
  ) {
    return
  }
  return thumbnail(file).catch(() => undefined)
}
