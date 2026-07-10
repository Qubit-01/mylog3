<script lang="ts" setup>
/** Log 编辑器：新增和编辑共用的正文表单，空值用于新增，已有值用于编辑 */
import { createLog, type Log, updateLog } from '@/api'
import { useLogStore } from '@/stores/log'
import type { LogEditorMedia } from '@/components/LogEditorMedias.vue'
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
const pending = ref(false)
const canSubmit = computed(() => !!form.value.text.trim() && !pending.value)
/** 可见范围切换项；label 用于界面展示，value 保持后端 DTO 的 scope 枚举值 */
const scopeOptions: Array<{ label: string; value: Log['scope'] }> = [
  { label: '私密', value: 'PRIVATE' },
  { label: '公开', value: 'PUBLIC' },
]

/** 保存当前正文；有 id 时更新已有 Log，无 id 时创建新 Log */
const onSubmit = async () => {
  if (!canSubmit.value) return
  pending.value = true
  try {
    const { id } = form.value
    const payload = {
      scope: form.value.scope,
      logAt: form.value.logAt,
      text: form.value.text.trim(),
      medias: form.value.medias,
      audios: form.value.audios,
      files: form.value.files,
      tags: form.value.tags,
      location: form.value.location,
      people: form.value.people,
      extra: form.value.extra,
    }
    const log = id ? await updateLog({ id, ...payload }) : await createLog(payload)
    logStore.upsert(log)
    form.value = id ? cloneDeep(log) : createEmptyLog()
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
    <LogEditorMedias v-model="medias" />
    <div class="actions">
      <div class="tools">
        <ElSegmented v-model="form.scope" :options="scopeOptions" size="small" />
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
