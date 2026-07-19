import { toResourceUrl } from 'shared/cos'
import type { UploadUserFile } from 'element-plus'
import { computed, type Ref } from 'vue'

/**
 * 可适配为上传列表项的既有资源。
 * 字段契约跟随后端 `LogResourceDto`，变更时需保持同步。
 */
export interface Resource {
  /** 资源业务类型 */
  type: 'image' | 'video' | 'audio' | 'file'
  /** 资源 URL 或 COS object key */
  url: string
  /** 优先用于列表展示的轻量预览资源 */
  previewUrl?: string
}

/** 图片 / 视频资源，类型契约跟随后端 `LogMediaDto` */
export interface MediaResource extends Resource {
  /** 媒体类型 */
  type: 'image' | 'video'
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
 * 读取时将既有资源适配为成功状态的展示项，并与本地新增文件合并；
 * 写入时通过业务字段 `_origin` 将列表同步拆回两个 model。
 * @returns 可直接绑定 `ElUpload` file-list 的可写计算属性
 */
export const computedFileList = <T extends Resource>(
  /** 既有资源，展示地址优先使用 `previewUrl` */
  files: Ref<T[]>,
  /** 本轮新增的本地文件 */
  fileList: Ref<UploadUserFile[]>,
) =>
  computed<(UploadUserFile & { _origin?: T })[]>({
    get: (list) => [
      ...files.value.map((item) => ({
        ...list?.find((file) => file._origin === item),
        name: item.url,
        url: toResourceUrl(item.previewUrl ?? item.url),
        status: 'success' as const,
        _origin: item,
      })),
      ...fileList.value,
    ],
    set: (list) => {
      files.value = list.flatMap((item) => (item._origin ? [item._origin] : []))
      fileList.value = list.filter((item) => !item._origin)
    },
  })
