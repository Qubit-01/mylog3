import {
  createLog,
  type CreateLogInput,
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
import { useLogStore } from '@/stores/log'
import type { UploadUserFile } from 'element-plus'
import { cloneDeep } from 'lodash-unified'
import type { MaybeRefOrGetter } from 'vue'

/** 编辑器草稿：只包含用户可编辑、可提交的 Log 字段 */
export type LogEditorDraft = Required<CreateLogInput>

/** 已确认带浏览器原始 File 的待上传项 */
type PreparedUpload = CosUploadFile & { Body: File }

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

/** 管理 Log 编辑草稿、附件事务和保存状态，组件本身只负责渲染 */
export const useLogEditor = (
  initialValue: MaybeRefOrGetter<Log | undefined>,
) => {
  const logStore = useLogStore()
  const draft = ref(createDraft(toValue(initialValue)))
  const fileMap = reactive({
    medias: [] as UploadUserFile[],
    audios: [] as UploadUserFile[],
    files: [] as UploadUserFile[],
  })
  const pending = ref(false)

  /** 上传全部本地附件，并转换为 Log 接口需要的三类资源 */
  const uploadAttachments = async (): Promise<LogAttachments> => {
    const mediaUploads = prepareUploads(fileMap.medias)
    const audioUploads = prepareUploads(fileMap.audios)
    const fileUploads = prepareUploads(fileMap.files)
    const keys = await uploadCosFiles([
      ...mediaUploads,
      ...audioUploads,
      ...fileUploads,
    ])
    let offset = 0

    return {
      medias: mediaUploads.map((item) => ({
        type: item.Body.type.startsWith('image/') ? 'image' : 'video',
        url: keys[offset++]!,
      })),
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
      ...attachments.medias.map(({ url }) => url),
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
    const source = toValue(initialValue)
    const snapshot = cloneDeep(draft.value)
    pending.value = true

    try {
      let attachments
      try {
        attachments = await uploadAttachments()
      } catch {
        ElMessage.error('文件上传失败，请稍后重试')
        return
      }

      const payload: CreateLogInput = {
        ...snapshot,
        text: snapshot.text.trim(),
        medias: [...snapshot.medias, ...attachments.medias],
        audios: [...snapshot.audios, ...attachments.audios],
        files: [...snapshot.files, ...attachments.files],
      }
      let saved: Log
      try {
        saved = source
          ? await updateLog({ id: source.id, ...payload })
          : await createLog(payload)
      } catch {
        await rollbackAttachments(attachments).catch(() => undefined)
        return
      }

      logStore.upsert(saved)
      draft.value = source ? createDraft(saved) : createDraft()
      resetAttachments()
    } finally {
      pending.value = false
    }
  }

  watch(
    () => toValue(initialValue),
    (value) => {
      draft.value = createDraft(value)
      resetAttachments()
    },
  )

  return {
    /** 当前可编辑草稿 */
    draft,
    /** 是否正在上传或保存 */
    pending,
    /** 按业务类型分组的本地待提交文件 */
    fileMap,
    /** 提交当前草稿 */
    submit,
  }
}
