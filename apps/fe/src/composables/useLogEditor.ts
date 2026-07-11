import {
  createLog,
  type CreateLog,
  type Log,
  type LogAudio,
  type LogFile,
  type LogMedia,
  updateLog,
} from '@/api'
import {
  deleteCosFiles,
  type CosUploadFile,
  uploadCosFiles,
} from '@/composables/cos'
import { compressImagePreview } from '@/composables/compression'
import { useLogStore } from '@/stores/log'
import type { UploadUserFile } from 'element-plus'
import { cloneDeep } from 'lodash-unified'

/** 编辑器草稿：只包含用户可编辑、可提交的 Log 字段 */
export type LogEditorDraft = Required<CreateLog>

/** 已确认带浏览器原始 File 的待上传项 */
type PreparedUpload = CosUploadFile & { Body: File }

/** 待上传媒体及其可选轻量预览资源；原始媒体始终保持用户选择的原始 File */
interface PreparedMediaUpload {
  /** 图片或视频业务类型 */
  type: LogMedia['type']
  /** 未经重编码的原始媒体 */
  original: PreparedUpload
  /** 轻量预览资源；当前由图片压缩产生，未来视频压缩版本复用此字段 */
  preview?: PreparedUpload
}

/** 一次提交产生的三类附件 */
interface LogAttachments {
  /** 图片和视频附件 */
  medias: LogMedia[]
  /** 音频附件 */
  audios: LogAudio[]
  /** 普通文件附件 */
  files: LogFile[]
}

/** 将已有 Log 或空值转换为与服务端实体隔离的本地草稿 */
const createDraft = (log?: Log): LogEditorDraft =>
  log
    ? cloneDeep({
        scope: log.scope,
        logAt: log.logAt,
        text: log.text,
        medias: log.medias,
        audios: log.audios,
        files: log.files,
        tags: log.tags,
        location: log.location,
        people: log.people,
        extra: log.extra,
      })
    : {
        scope: 'PRIVATE',
        logAt: new Date().toISOString(),
        text: '',
        medias: [],
        audios: [],
        files: [],
        tags: [],
        location: [],
        people: [],
        extra: {},
      }

/** 将本地文件草稿转换为 COS 上传项；没有原始 File 的条目不会参与上传 */
const prepareUploads = (items: UploadUserFile[]): PreparedUpload[] =>
  items.flatMap(({ raw }) =>
    raw
      ? [
          {
            Body: raw,
            Key: `mylog/${crypto.randomUUID()}-${raw.name}`,
          },
        ]
      : [],
  )

/**
 * 为图片生成列表预览图，同时保留原始文件用于高清预览和完整元数据读取。
 * JPEG 预览图尽量复制 EXIF，原始文件始终不参与重编码。
 * @returns 与媒体顺序一致的原始文件及可选轻量预览上传项
 */
const prepareMediaUploads = (items: UploadUserFile[]) =>
  Promise.all(
    items
      .flatMap(({ raw }) => (raw ? [raw] : []))
      .map(async (raw): Promise<PreparedMediaUpload> => {
        const id = crypto.randomUUID()
        const original: PreparedUpload = {
          Body: raw,
          Key: `mylog/${id}-${raw.name}`,
        }
        const preview = await compressImagePreview(raw)
        if (!preview) {
          return {
            type: raw.type.startsWith('image/') ? 'image' : 'video',
            original,
          }
        }

        return {
          type: 'image',
          original,
          preview: {
            Body: preview,
            Key: `mylog/preview/${id}-${preview.name}`,
          },
        }
      }),
  )

/** 管理 Log 编辑草稿、附件事务和保存状态，组件本身只负责渲染 */
export const useLogEditor = (log?: Log) => {
  const logStore = useLogStore()
  const draft = ref(createDraft(log))
  const fileMap = reactive({
    medias: [] as UploadUserFile[],
    audios: [] as UploadUserFile[],
    files: [] as UploadUserFile[],
  })
  const pending = ref(false)
  const uploadInfo = reactive({ percent: -1, speed: 0 })

  /** 上传全部本地附件，并转换为 Log 接口需要的三类资源 */
  const uploadAttachments = async (): Promise<LogAttachments> => {
    const mediaUploads = await prepareMediaUploads(fileMap.medias)
    const audioUploads = prepareUploads(fileMap.audios)
    const fileUploads = prepareUploads(fileMap.files)
    const keys = await uploadCosFiles(
      [
        ...mediaUploads.flatMap(({ original, preview }) =>
          preview ? [original, preview] : [original],
        ),
        ...audioUploads,
        ...fileUploads,
      ],
      ({ percent, speed }) => {
        uploadInfo.percent = Math.round(percent * 99)
        uploadInfo.speed = Number((speed / 1024 / 1024).toFixed(2))
      },
    )
    let offset = 0

    return {
      medias: mediaUploads.map(({ type, preview }) => {
        const url = keys[offset++]!
        const previewUrl = preview ? keys[offset++] : undefined
        return { type, url, previewUrl }
      }),
      audios: audioUploads.map(() => ({
        type: 'audio',
        url: keys[offset++]!,
      })),
      files: fileUploads.map(() => ({
        type: 'file',
        url: keys[offset++]!,
      })),
    }
  }

  /** 删除一次提交已上传的全部附件，用于 Log 保存失败时回滚 */
  const rollbackAttachments = (attachments: LogAttachments) =>
    deleteCosFiles([
      ...attachments.medias.flatMap(({ url, previewUrl }) =>
        previewUrl ? [url, previewUrl] : [url],
      ),
      ...attachments.audios.map(({ url }) => url),
      ...attachments.files.map(({ url }) => url),
    ])

  /** 清空全部本地附件草稿 */
  const resetAttachments = () => {
    fileMap.medias = []
    fileMap.audios = []
    fileMap.files = []
  }

  /** 提交当前草稿；附件与 Log 保存组成一个尽力回滚的事务 */
  const submit = async () => {
    if (!draft.value.text.trim() || pending.value) return
    const snapshot = cloneDeep(draft.value)
    pending.value = true
    uploadInfo.percent = 0
    uploadInfo.speed = 0

    try {
      let attachments
      try {
        attachments = await uploadAttachments()
        uploadInfo.percent = 99
        uploadInfo.speed = 0
      } catch {
        ElMessage.error('文件上传失败，请稍后重试')
        return
      }

      const payload: CreateLog = {
        ...snapshot,
        text: snapshot.text.trim(),
        medias: [...snapshot.medias, ...attachments.medias],
        audios: [...snapshot.audios, ...attachments.audios],
        files: [...snapshot.files, ...attachments.files],
      }
      let saved: Log
      try {
        saved = log
          ? await updateLog({ id: log.id, ...payload })
          : await createLog(payload)
      } catch {
        await rollbackAttachments(attachments).catch(() => undefined)
        return
      }

      logStore.upsert(saved)
      draft.value = log ? createDraft(saved) : createDraft()
      resetAttachments()
      uploadInfo.percent = 100
    } finally {
      pending.value = false
      uploadInfo.percent = -1
      uploadInfo.speed = 0
    }
  }

  return {
    /** 当前可编辑草稿 */
    draft,
    /** 是否正在上传或保存 */
    pending,
    /** 当前上传百分比与速度；percent 为 -1 时不展示进度 */
    uploadInfo,
    /** 按业务类型分组的本地待提交文件 */
    fileMap,
    /** 提交当前草稿 */
    submit,
  }
}
