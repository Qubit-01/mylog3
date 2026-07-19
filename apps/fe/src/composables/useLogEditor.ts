import { createLog, type CreateLog, type Log, updateLog } from '@/api'
import {
  collectCosKeys,
  deleteCosFiles,
  uploadCosFiles,
} from '@/composables/cos'
import { compressImagePreview } from '@/composables/compression'
import { useLogStore } from '@/stores/log'
import type { UploadUserFile } from 'element-plus'
import { cloneDeep } from 'lodash-unified'

/**
 * 编辑器草稿：`text` / `scope` 始终存在，其余字段仅在启用对应编辑组件时才出现（`undefined` 表示未启用）。
 * `logAt` 也遵循同样约定：未启用时为 undefined，服务端提交时自动兼底为当前时间。
 * 编辑时从原 Log 深克隆；新增时可选字段由对应编辑组件按需启用。
 * UI 层用 `v-if="logEdit.xxx !== undefined"` 控制编辑组件的显隐。
 */
export type LogEdit = CreateLog & Required<Pick<CreateLog, 'text' | 'scope'>>

/** 生成 COS 目录相对 key，避免用户目录内重名 */
const cosKey = (name: string, prefix = '') =>
  `mylog/${prefix}${crypto.randomUUID()}-${name}`

/** 生成本地草稿：新建时使用默认值，编辑时深克隆原 Log */
const createLogEdit = (log?: Log): LogEdit =>
  cloneDeep({ scope: 'PRIVATE', text: '', ...log })

/**
 * 将业务列表末尾的本地占位资源替换为上传后的正式资源。
 * @returns 保持既有资源顺序的可提交列表；原列表未启用时返回 undefined
 */
const replaceLocalResources = <T>(
  /** 包含既有资源和本地占位项的业务列表 */
  resources: T[] | undefined,
  /** 与本地占位项一一对应的上传结果 */
  uploadedResources: T[],
) =>
  resources
    ?.slice(0, Math.max(0, resources.length - uploadedResources.length))
    .concat(uploadedResources)

/** 管理 Log 编辑草稿、附件上传清理和保存状态，组件本身只负责渲染 */
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
        status.value = `上传文件中… ${Math.round(percent * 100)}% · ${(speed / 1024 / 1024).toFixed(2)}MB/s`
      },
    )

    // 与上方上传项的顺序一致：先 media（可能带 preview），再 audio，最后 file
    let i = 0
    return {
      medias: medias.map((f, idx) => ({
        type: f.type.startsWith('video/')
          ? ('video' as const)
          : ('image' as const),
        name: f.name,
        url: keys[i++]!,
        previewUrl: previews[idx] ? keys[i++] : undefined,
      })),
      audios: audios.map((file) => ({
        type: 'audio' as const,
        name: file.name,
        url: keys[i++]!,
      })),
      files: files.map((file) => ({
        type: 'file' as const,
        name: file.name,
        url: keys[i++]!,
      })),
    }
  }

  /** 提交当前草稿；保存成功后尽力清理不再引用的附件。返回保存后的 Log；未提交或失败返回 undefined */
  const submit = async (): Promise<Log | undefined> => {
    if (!logEdit.value.text.trim() || pending.value) return
    const _logEdit = cloneDeep(logEdit.value)
    pending.value = true

    try {
      let uploaded
      try {
        uploaded = await uploadAttachments()
      } catch {
        ElMessage.error('文件上传失败，请稍后重试')
        return
      }

      // 保留已启用字段中的既有附件，并用本次上传结果替换本地占位项
      const payload: CreateLog = {
        ..._logEdit,
        medias: replaceLocalResources(_logEdit.medias, uploaded.medias),
        audios: replaceLocalResources(_logEdit.audios, uploaded.audios),
        files: replaceLocalResources(_logEdit.files, uploaded.files),
      }
      status.value = '提交 Log 中…'
      // 请求可能已落库但响应失败，不能删除可能已被引用的新文件
      const saved = await (
        log ? updateLog({ id: log.id, ...payload }) : createLog(payload)
      ).catch(() => undefined)
      if (!saved) return

      // 编辑成功后：把用户从既有列表里移除的原始附件在 COS 中一并清理
      if (log) {
        const keptKeys = new Set(
          collectCosKeys(saved.medias, saved.audios, saved.files),
        )
        const removedKeys = collectCosKeys(
          log.medias,
          log.audios,
          log.files,
        ).filter((key) => !keptKeys.has(key))
        await deleteCosFiles(removedKeys).catch(() => undefined)
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
    /** 按业务类型分组的本地待上传新增文件 */
    fileMap,
    /** 提交当前草稿 */
    submit,
  }
}
