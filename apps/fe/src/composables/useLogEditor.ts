import {
  createLog,
  type CreateLog,
  type Log,
  type LogMedia,
  updateLog,
} from '@/api'
import { deleteCosFiles, uploadCosFiles } from '@/composables/cos'
import { compressImagePreview } from '@/composables/compression'
import { useLogStore } from '@/stores/log'
import type { UploadUserFile } from 'element-plus'
import { cloneDeep } from 'lodash-unified'

/**
 * 编辑器草稿：`logAt` / `text` / `scope` 始终存在，其余字段仅在启用对应编辑组件时才出现（`undefined` 表示未启用）。
 * UI 层用 `v-if="logEdit.xxx !== undefined"` 控制编辑组件的显隐。
 */
export type LogEdit = CreateLog &
  Required<Pick<CreateLog, 'logAt' | 'text' | 'scope'>>

/** 一条待上传媒体：始终有原始文件，图片会附带一份压缩预览 */
interface PreparedMedia {
  type: LogMedia['type']
  original: File
  preview?: File
}

/** 生成 COS 目录相对 key，避免用户目录内重名 */
const cosKey = (name: string, prefix = '') =>
  `mylog/${prefix}${crypto.randomUUID()}-${name}`

/** 从 Element Plus 上传项里取出真正的原始 File */
const rawFiles = (items: UploadUserFile[]) =>
  items.flatMap(({ raw }) => (raw ? [raw] : []))

/** 图片生成压缩预览；视频当前无预览；原始文件永远不参与重编码 */
const prepareMedia = async (raw: File): Promise<PreparedMedia> => {
  const preview = await compressImagePreview(raw)
  if (preview) return { type: 'image', original: raw, preview }
  return {
    type: raw.type.startsWith('image/') ? 'image' : 'video',
    original: raw,
  }
}

/** 新建 Log 时的草稿默认值：只保留始终展示的字段 */
const emptyLogEdit = (): LogEdit => ({
  scope: 'PRIVATE',
  text: '',
  logAt: new Date().toISOString(),
})

/** 已有 Log → 本地草稿：与服务端实体隔离，可选字段按 log 上的真实存在与否决定 */
const createLogEdit = (log?: Log): LogEdit =>
  log ? cloneDeep({ ...emptyLogEdit(), ...log }) : emptyLogEdit()

/** 管理 Log 编辑草稿、附件事务和保存状态，组件本身只负责渲染 */
export const useLogEditor = (log?: Log) => {
  const logStore = useLogStore()
  const logEdit = ref(createLogEdit(log))
  const fileMap = reactive({
    medias: [] as UploadUserFile[],
    audios: [] as UploadUserFile[],
    files: [] as UploadUserFile[],
  })
  const pending = ref(false)
  const uploadInfo = reactive({ percent: -1, speed: 0 })

  /** 上传全部本地附件，并转换为 Log 接口需要的三类资源 */
  const uploadAttachments = async () => {
    const medias = await Promise.all(rawFiles(fileMap.medias).map(prepareMedia))
    const audios = rawFiles(fileMap.audios)
    const files = rawFiles(fileMap.files)

    const keys = await uploadCosFiles(
      [
        ...medias.flatMap(({ original, preview }) => [
          { Body: original, Key: cosKey(original.name) },
          ...(preview
            ? [{ Body: preview, Key: cosKey(preview.name, 'preview/') }]
            : []),
        ]),
        ...audios.map((file) => ({ Body: file, Key: cosKey(file.name) })),
        ...files.map((file) => ({ Body: file, Key: cosKey(file.name) })),
      ],
      ({ percent, speed }) => {
        uploadInfo.percent = Math.round(percent * 99)
        uploadInfo.speed = Number((speed / 1024 / 1024).toFixed(2))
      },
    )

    // 生产与消费 keys 的顺序严格对应：先 media（可能带 preview），再 audio，最后 file
    let i = 0
    return {
      keys,
      medias: medias.map(({ type, preview }) => ({
        type,
        url: keys[i++]!,
        previewUrl: preview ? keys[i++] : undefined,
      })),
      audios: audios.map(() => ({ type: 'audio' as const, url: keys[i++]! })),
      files: files.map(() => ({ type: 'file' as const, url: keys[i++]! })),
    }
  }

  /** 清空全部本地附件草稿 */
  const resetAttachments = () => {
    fileMap.medias = []
    fileMap.audios = []
    fileMap.files = []
  }

  /** 提交当前草稿；附件与 Log 保存组成一个尽力回滚的事务 */
  const submit = async () => {
    if (!logEdit.value.text.trim() || pending.value) return
    const snapshot = cloneDeep(logEdit.value)
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

      // 已启用的附件字段与本次新上传的合并；未启用的字段仍为 undefined，不会污染 payload
      const payload: CreateLog = {
        ...snapshot,
        text: snapshot.text.trim(),
        // 新建时以点击提交的时间为准；编辑时保留原 Log 的 logAt
        logAt: log ? snapshot.logAt : new Date().toISOString(),
        medias: [...(snapshot.medias ?? []), ...attachments.medias],
        audios: [...(snapshot.audios ?? []), ...attachments.audios],
        files: [...(snapshot.files ?? []), ...attachments.files],
      }
      let saved: Log
      try {
        saved = log
          ? await updateLog({ id: log.id, ...payload })
          : await createLog(payload)
      } catch {
        await deleteCosFiles(attachments.keys).catch(() => undefined)
        return
      }

      logStore.upsert(saved)
      logEdit.value = log ? createLogEdit(saved) : createLogEdit()
      resetAttachments()
      uploadInfo.percent = 100
    } finally {
      pending.value = false
      uploadInfo.percent = -1
      uploadInfo.speed = 0
    }
  }

  return {
    /** 当前可编辑草稿；`text` / `scope` 始终存在，其余字段 undefined 表示未启用编辑 */
    logEdit,
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
