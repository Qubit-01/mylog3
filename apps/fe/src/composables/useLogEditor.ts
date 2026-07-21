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
  collectCosKeys,
  deleteCosFiles,
  uploadCosFiles,
} from '@/composables/cos'
import { compressImagePreview } from '@/composables/compression'
import { stringifyError } from '@/composables/error'
import { useLogStore } from '@/stores/log'
import type { UploadUserFile } from 'element-plus'
import { cloneDeep, omit } from 'lodash-unified'
import { parseImageThumbnail } from 'shared/exifr'

/**
 * 编辑器草稿：`text` / `scope` 始终存在，其余字段仅在启用对应编辑组件时才出现（`undefined` 表示未启用）。
 * `logAt` 也遵循同样约定：未启用时为 undefined，服务端提交时自动兼底为当前时间。
 * 编辑时从原 Log 深克隆；新增时可选字段由对应编辑组件按需启用。
 * UI 层用 `v-if="logEdit.xxx !== undefined"` 控制编辑组件的显隐。
 */
export type LogEdit = Omit<CreateLog, 'medias' | 'audios' | 'files'> & {
  /** 媒体编辑列表；本地待上传项通过 `raw` 保留原始 File */
  medias?: (UploadUserFile & LogMedia)[]
  /** 音频编辑列表；本地待上传项通过 `raw` 保留原始 File */
  audios?: (UploadUserFile & LogAudio)[]
  /** 文件编辑列表；本地待上传项通过 `raw` 保留原始 File */
  files?: (UploadUserFile & LogFile)[]
} & Required<Pick<CreateLog, 'text' | 'scope'>>

/** 生成 COS 目录相对 key，避免用户目录内重名 */
const cosKey = (name: string, prefix = '') =>
  `mylog/${prefix}${crypto.randomUUID()}-${name}`

/** 生成本地草稿：新建时使用默认值，编辑时深克隆原 Log */
const createLogEdit = (log?: Log): LogEdit =>
  cloneDeep({ scope: 'PRIVATE', text: '', ...log })

/**
 * 保留既有资源，并将带 raw 的本地编辑项合并为上传结果。
 * @returns 保持编辑顺序的可提交资源列表；编辑项未启用时返回 undefined
 */
const replaceLocalResources = <T extends object>(
  /** 按“既有资源 + 本地编辑项”排列的资源列表 */
  resources: T[] | undefined,
  /** 与本地编辑项一一对应的上传结果 */
  uploadedResources: T[],
) => {
  if (!resources) return
  const start = Math.max(0, resources.length - uploadedResources.length)
  return resources.map((resource, index) =>
    index < start
      ? resource
      : { ...resource, ...uploadedResources[index - start] },
  )
}

/** 管理 Log 编辑草稿、附件上传清理和保存状态，组件本身只负责渲染 */
export const useLogEditor = (log?: Log) => {
  const logStore = useLogStore()
  const { request: requestWakeLock, release: releaseWakeLock } = useWakeLock()
  const logEdit = ref(createLogEdit(log))
  const pending = ref(false)
  /** 当前提交阶段的展示文案；`undefined` 表示空闲 */
  const status = ref<string>()

  /** 上传全部本地附件，并转换为 Log 接口需要的三类资源 */
  const uploadAttachments = async (
    /** 本次需要上传的本地图片 / 视频 */
    medias: File[],
    /** 本次需要上传的本地音频 */
    audios: File[],
    /** 本次需要上传的普通文件 */
    files: File[],
  ) => {
    // 2.2.1 定位图片，并建立与媒体列表下标一致的预览列表
    const imageIndexes = medias.flatMap((media, index) =>
      media.type.startsWith('image/') ? [index] : [],
    )
    const previews: (File | undefined)[] = Array(medias.length)

    // 2.2.2 优先使用内嵌缩略图，否则压缩原图生成预览
    for (const [index, mediaIndex] of imageIndexes.entries()) {
      status.value = `生成缩略图中… ${index + 1}/${imageIndexes.length}`
      const media = medias[mediaIndex]!
      const thumbnail = await parseImageThumbnail(media)
      previews[mediaIndex] = thumbnail
        ? new File([new Uint8Array(thumbnail)], `${media.name}.jpg`, {
            type: 'image/jpeg',
            lastModified: media.lastModified,
          })
        : await compressImagePreview(media)
    }

    // 2.2.3 按媒体、音频、文件的顺序上传全部本地附件
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

    // 2.2.4 按上传顺序将 COS key 转换为三类资源
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
    // 1. 校验并固化本次提交
    // 1.1 校验草稿内容和提交状态
    if (!logEdit.value.text.trim() || pending.value) return
    // 1.2 固化附件和基础字段，避免提交期间受编辑状态影响
    const { medias, audios, files } = logEdit.value
    const baseLogEdit = cloneDeep(
      omit(logEdit.value, ['medias', 'audios', 'files']),
    )
    // 1.3 进入提交状态并等待编辑器销毁
    pending.value = true
    await nextTick()

    try {
      // 2. 准备并上传本地附件
      // 2.1 尽力保持屏幕唤醒
      await requestWakeLock('screen').catch(() => undefined)
      // 2.2 生成图片缩略图并上传全部本地附件
      let uploaded
      try {
        uploaded = await uploadAttachments(
          medias?.flatMap(({ raw }) => (raw ? [raw] : [])) ?? [],
          audios?.flatMap(({ raw }) => (raw ? [raw] : [])) ?? [],
          files?.flatMap(({ raw }) => (raw ? [raw] : [])) ?? [],
        )
      } catch (error) {
        // 2.3 展示完整上传错误并终止本次提交
        console.error(error)
        ElNotification.error({ message: stringifyError(error), duration: 0 })
        return
      }

      // 3. 保存 Log 并同步本地状态
      // 3.1 保留已启用字段中的既有附件，并用本次上传结果替换本地占位项
      const payload: CreateLog = {
        ...baseLogEdit,
        medias: replaceLocalResources(medias, uploaded.medias),
        audios: replaceLocalResources(audios, uploaded.audios),
        files: replaceLocalResources(files, uploaded.files),
      }
      status.value = '提交 Log 中…'
      // 3.2 请求可能已落库但响应失败，不能删除可能已被引用的新文件
      const saved = await (
        log ? updateLog({ id: log.id, ...payload }) : createLog(payload)
      ).catch(() => undefined)
      if (!saved) return

      // 3.3 编辑成功后，把用户从既有列表里移除的原始附件在 COS 中一并清理
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

      // 3.4 同步本地 Store，并重置或刷新草稿
      logStore.upsert(saved)
      logEdit.value = log ? createLogEdit(saved) : createLogEdit()
      return saved
    } finally {
      // 4. 释放提交期间占用的状态
      // 4.1 释放屏幕唤醒锁
      await releaseWakeLock().catch(() => undefined)
      // 4.2 恢复编辑器和空闲状态
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
    /** 提交当前草稿 */
    submit,
  }
}
