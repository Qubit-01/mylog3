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
 * 媒体上传项：在 Element Plus 上传文件上保留编辑阶段生成的轻量预览文件。
 */
export interface UploadMediaFile extends UploadUserFile {
  /** 当前展示图片的轻量预览文件 */
  previewFile?: File
}
