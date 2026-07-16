import { createLog, type CreateLog, type Log, updateLog } from '@/api'
import { deleteCosFiles, uploadCosFiles } from '@/composables/cos'
import { compressImagePreview } from '@/composables/compression'
import { useLogStore } from '@/stores/log'
import type { UploadUserFile } from 'element-plus'
import { cloneDeep } from 'lodash-unified'

/**
 * 编辑器草稿：`text` / `scope` 始终存在，其余字段仅在启用对应编辑组件时才出现（`undefined` 表示未启用）。
 * `logAt` 也遵循同样约定：未启用时为 undefined，服务端提交时自动兼底为当前时间。
 * UI 层用 `v-if="logEdit.xxx !== undefined"` 控制编辑组件的显隐。
 */
export type LogEdit = CreateLog & Required<Pick<CreateLog, 'text' | 'scope'>>

/** 生成 COS 目录相对 key，避免用户目录内重名 */
const cosKey = (name: string, prefix = '') =>
  `mylog/${prefix}${crypto.randomUUID()}-${name}`

/** 生成本地草稿：新建时给默认值，编辑时从服务端实体深克隆；可选字段按 log 的真实存在与否决定 */
const createLogEdit = (log?: Log): LogEdit =>
  cloneDeep({ scope: 'PRIVATE', text: '', ...log })

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
  /** 当前提交阶段的展示文案；`undefined` 表示空闲 */
  const status = ref<string>()

  /** 上传全部本地附件，并转换为 Log 接口需要的三类资源 */
  const uploadAttachments = async () => {
    status.value = '压缩图片中…'
    // 从 Element Plus 上传项里取原始 File；图片额外生成压缩预览，视频对应位置为 undefined
    const medias = fileMap.medias.flatMap(({ raw }) => (raw ? [raw] : []))
    const audios = fileMap.audios.flatMap(({ raw }) => (raw ? [raw] : []))
    const files = fileMap.files.flatMap(({ raw }) => (raw ? [raw] : []))
    const previews = await Promise.all(medias.map(compressImagePreview))

    status.value = '上传文件中…'
    const keys = await uploadCosFiles(
      [
        ...medias.flatMap((f, i) => {
          const preview = previews[i]
          return preview
            ? [
                { Body: f, Key: cosKey(f.name) },
                { Body: preview, Key: cosKey(preview.name, 'preview/') },
              ]
            : [{ Body: f, Key: cosKey(f.name) }]
        }),
        ...audios.map((f) => ({ Body: f, Key: cosKey(f.name) })),
        ...files.map((f) => ({ Body: f, Key: cosKey(f.name) })),
      ],
      ({ percent, speed }) => {
        const p = Math.round(percent * 100)
        const s = (speed / 1024 / 1024).toFixed(2)
        status.value = `上传文件中… ${p}% · ${s}MB/s`
      },
    )

    // 与上方上传项的顺序一致：先 media（可能带 preview），再 audio，最后 file
    let i = 0
    return {
      keys,
      medias: medias.map((f, idx) => ({
        type: f.type.startsWith('video/')
          ? ('video' as const)
          : ('image' as const),
        url: keys[i++]!,
        previewUrl: previews[idx] ? keys[i++] : undefined,
      })),
      audios: audios.map(() => ({ type: 'audio' as const, url: keys[i++]! })),
      files: files.map(() => ({ type: 'file' as const, url: keys[i++]! })),
    }
  }

  /** 提交当前草稿；附件与 Log 保存组成一个尽力回滚的事务。返回保存后的 Log；未提交或失败返回 undefined */
  const submit = async (): Promise<Log | undefined> => {
    if (!logEdit.value.text.trim() || pending.value) return
    const snapshot = cloneDeep(logEdit.value)
    pending.value = true

    try {
      let attachments
      try {
        attachments = await uploadAttachments()
      } catch {
        ElMessage.error('文件上传失败，请稍后重试')
        return
      }

      // 已启用的附件字段与本次新上传的合并；未启用的字段仍为 undefined，不会污染 payload
      const payload: CreateLog = {
        ...snapshot,
        medias: [...(snapshot.medias ?? []), ...attachments.medias],
        audios: [...(snapshot.audios ?? []), ...attachments.audios],
        files: [...(snapshot.files ?? []), ...attachments.files],
      }
      status.value = '提交 Log 中…'
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
      fileMap.medias = []
      fileMap.audios = []
      fileMap.files = []
      return saved
    } finally {
      pending.value = false
      status.value = undefined
    }
  }

  return {
    /** 当前可编辑草稿；`text` / `scope` 始终存在，其余字段 undefined 表示未启用编辑 */
    logEdit,
    /** 是否正在上传或保存 */
    pending,
    /** 当前提交阶段的展示文案；`undefined` 表示空闲 */
    status,
    /** 按业务类型分组的本地待提交文件 */
    fileMap,
    /** 提交当前草稿 */
    submit,
  }
}
