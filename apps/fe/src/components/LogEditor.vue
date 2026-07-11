<script lang="ts" setup>
/** Log 编辑器：新增和编辑共用的正文表单，空值用于新增，已有值用于编辑 */
import {
  createLog,
  type Log,
  type LogAudio,
  type LogFile,
  type LogMedia,
  updateLog,
} from '@/api'
import { useLogStore } from '@/stores/log'
import type { LogEditorAudio } from '@/components/LogEditorAudios.vue'
import type { LogEditorFile } from '@/components/LogEditorFiles.vue'
import type { LogEditorMedia } from '@/components/LogEditorMedias.vue'
import { deleteCosFiles, uploadCosFiles } from '@/composables/cos'
import { Promotion } from '@element-plus/icons-vue'
import { cloneDeep } from 'lodash-unified'

const props = defineProps<{
  /** 初始完整 Log；不传时组件内部创建空草稿 */
  initialValue?: Log
}>()

const emit = defineEmits<{
  /** 保存成功后抛出最新 Log，页面可按需做额外响应 */
  saved: [value: Log]
}>()

const logStore = useLogStore()
/** 创建新增用的完整 Log 草稿；占位的系统字段在创建成功后由后端返回值覆盖 */
const createEmptyLog = (): Log => ({
  id: 0,
  userId: 0,
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
  updatedAt: '',
  createdAt: '',
})
const form = ref<Log>(
  props.initialValue ? cloneDeep(props.initialValue) : createEmptyLog(),
)
const medias = ref<LogEditorMedia[]>([])
const audios = ref<LogEditorAudio[]>([])
const files = ref<LogEditorFile[]>([])
const pending = ref(false)
const canSubmit = computed(() => !!form.value.text.trim() && !pending.value)
/** 可见范围切换项；label 用于界面展示，value 保持后端 DTO 的 scope 枚举值 */
const scopeOptions: Array<{ label: string; value: Log['scope'] }> = [
  { label: '私密', value: 'PRIVATE' },
  { label: '公开', value: 'PUBLIC' },
]

/** 创建当前 Log 附件的 COS 相对路径；UUID 前缀便于保证唯一且支持下载时还原文件名 */
const createMylogPath = (file: File) =>
  `mylog/${crypto.randomUUID()}-${file.name}`

/** 上传当前编辑器新选附件，并按 Log DTO 的三类资源分组 */
const uploadAttachments = async () => {
  const pendingUploads = [
    ...medias.value.flatMap((item) => {
      if (!item.raw) return []
      return [
        {
          Body: item.raw,
          Key: createMylogPath(item.raw),
          type: item.raw.type.startsWith('image/')
            ? ('image' as const)
            : ('video' as const),
        },
      ]
    }),
    ...audios.value.flatMap((item) =>
      item.raw
        ? [
            {
              Body: item.raw,
              Key: createMylogPath(item.raw),
              type: 'audio' as const,
            },
          ]
        : [],
    ),
    ...files.value.flatMap((item) =>
      item.raw
        ? [
            {
              Body: item.raw,
              Key: createMylogPath(item.raw),
              type: 'file' as const,
            },
          ]
        : [],
    ),
  ]
  const result = await uploadCosFiles({ files: pendingUploads })
  const attachments = {
    medias: [] as LogMedia[],
    audios: [] as LogAudio[],
    files: [] as LogFile[],
  }
  for (const [index, { options }] of result.files.entries()) {
    const { type } = pendingUploads[index]!
    const { Key } = options
    if (type === 'image' || type === 'video') {
      attachments.medias.push({ type, url: Key })
      continue
    }
    if (type === 'audio') {
      attachments.audios.push({ type, url: Key })
      continue
    }
    attachments.files.push({ type, url: Key })
  }
  return attachments
}

/** 保存当前正文；有 id 时更新已有 Log，无 id 时创建新 Log */
const onSubmit = async () => {
  if (!canSubmit.value) return
  pending.value = true
  try {
    let attachments
    try {
      attachments = await uploadAttachments()
    } catch {
      ElMessage.error('文件上传失败，请稍后重试')
      return
    }
    const { id } = form.value
    const payload = {
      scope: form.value.scope,
      logAt: form.value.logAt,
      text: form.value.text.trim(),
      medias: [...form.value.medias, ...attachments.medias],
      audios: [...form.value.audios, ...attachments.audios],
      files: [...form.value.files, ...attachments.files],
      tags: form.value.tags,
      location: form.value.location,
      people: form.value.people,
      extra: form.value.extra,
    }
    let log: Log
    try {
      log = id ? await updateLog({ id, ...payload }) : await createLog(payload)
    } catch {
      void deleteCosFiles({
        Objects: [
          ...attachments.medias,
          ...attachments.audios,
          ...attachments.files,
        ].map((item) => ({ Key: item.url })),
      }).catch(() => undefined)
      return
    }
    logStore.upsert(log)
    form.value = id ? cloneDeep(log) : createEmptyLog()
    medias.value = []
    audios.value = []
    files.value = []
    emit('saved', log)
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <section class="LogEditor m-panel">
    <ElInput
      v-model="form.text"
      type="textarea"
      :autosize="{ minRows: 3, maxRows: 8 }"
      resize="none"
      maxlength="2000"
      show-word-limit
      placeholder="记录点什么..."
      @keydown.meta.enter.prevent="onSubmit"
      @keydown.ctrl.enter.prevent="onSubmit"
    />
    <div class="uploads">
      <LogEditorMedias v-model="medias" />
      <LogEditorAudios v-model="audios" />
      <LogEditorFiles v-model="files" />
    </div>
    <div class="actions">
      <div class="tools">
        <ElSegmented
          v-model="form.scope"
          :options="scopeOptions"
          size="small"
        />
      </div>
      <ElButton
        :icon="Promotion"
        :loading="pending"
        :disabled="!canSubmit"
        type="primary"
        circle
        @click="onSubmit"
      />
    </div>
  </section>
</template>

<style lang="scss" scoped>
.LogEditor {
  position: sticky;
  top: 12px;
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;

  > .uploads {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  > .actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;

    > .tools {
      display: flex;
      align-items: center;
      gap: 8px;
    }
  }
}
</style>
