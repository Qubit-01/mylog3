import { toResourceUrl } from 'shared/cos'
import type { UploadUserFile } from 'element-plus'

/**
 * 可适配为上传列表项的既有资源。
 * 字段契约跟随后端 `LogResourceDto`，变更时需保持同步。
 */
export interface Resource {
  /** 资源业务类型 */
  type: 'image' | 'video' | 'audio' | 'file'
  /** 上传时的原始文件名，用于展示和下载命名 */
  name: string
  /** 资源 URL 或 COS object key */
  url: string
  /** 优先用于列表展示的轻量预览资源 */
  previewUrl?: string
}

/** 图片 / 视频资源，类型契约跟随后端 `LogMediaDto` */
export interface MediaResource extends Resource {
  /** 媒体类型 */
  type: 'image' | 'video'
  /** 从媒体文件中解析并归一化的元数据 */
  metadata?: {
    /** 媒体拍摄时刻（ISO 8601 UTC 字符串） */
    takenAt?: string
    /** 媒体拍摄位置坐标 */
    location?: {
      /** 经度 */
      lng: number
      /** 纬度 */
      lat: number
    }
  }
}

/** 音频资源，类型契约跟随后端 `LogAudioDto` */
export interface AudioResource extends Resource {
  /** 音频类型 */
  type: 'audio'
}

/** 普通文件资源，类型契约跟随后端 `LogFileDto` */
export interface FileResource extends Resource {
  /** 文件类型 */
  type: 'file'
}

/**
 * 创建供 `ElUpload` 使用的统一可写文件列表。
 * files 始终按“既有资源 + 本地占位资源”排列，fileList 只保存对应的本地真实文件。
 * 读取时合并两部分供 ElUpload 展示，写入时再同步回两个 model。
 * @returns 可直接绑定 `ElUpload` file-list 的可写计算属性
 */
export const computedFileList = <T extends Resource>(
  /** 完整业务资源列表，已上传项的展示地址优先使用 `previewUrl` */
  files: Ref<T[]>,
  /** 本地待上传的真实文件 */
  fileList: Ref<UploadUserFile[]>,
  /** 将本地文件映射为未上传的业务占位资源 */
  toResource: (file: UploadUserFile) => T,
) =>
  computed<(UploadUserFile & { _origin?: T })[]>({
    get: (list) => [
      ...files.value
        .slice(0, Math.max(0, files.value.length - fileList.value.length))
        .map((item) => ({
          ...list?.find((file) => file._origin === item),
          name: item.name,
          url: toResourceUrl(item.previewUrl ?? item.url),
          status: 'success' as const,
          _origin: item,
        })),
      ...fileList.value,
    ],
    set: (list) => {
      const localFiles = list.filter((item) => !item._origin)
      files.value = [
        ...list.flatMap((item) => (item._origin ? [item._origin] : [])),
        ...localFiles.map(toResource),
      ]
      fileList.value = localFiles
    },
  })
