<script lang="ts" setup>
/** Log 编辑器：新增和编辑共用的正文表单，空值用于新增，已有值用于编辑 */
import { createLog, type Log, updateLog } from '@/api'
import { useLogStore } from '@/stores/log'
import type { LogEditorMedia } from '@/components/LogEditorMedias.vue'
import { Promotion } from '@element-plus/icons-vue'

/** Log 编辑器表单值；后续媒体、标签等字段在这里扩展 */
export interface LogEditorValue {
  /** 已有 Log id；存在时保存走编辑，否则走新增 */
  id?: number
  /** 可见范围；PRIVATE 仅自己可见，PUBLIC 同步展示到公开列表 */
  scope: Log['scope']
  /** 正文文本；空白内容不允许提交 */
  text: string
}

const props = withDefaults(
  defineProps<{
    /** 初始表单值；传 id 时保存走编辑，不传时组件内部使用空 Log 草稿 */
    initialValue?: Partial<LogEditorValue>
  }>(),
  {},
)

const emit = defineEmits<{
  /** 保存成功后抛出最新 Log，页面可按需做额外响应 */
  saved: [value: Awaited<ReturnType<typeof createLog>>]
}>()

const logStore = useLogStore()
const form = ref<LogEditorValue>({
  scope: 'PRIVATE',
  text: '',
  ...props.initialValue,
})
const medias = ref<LogEditorMedia[]>([])
const pending = ref(false)
const canSubmit = computed(() => !!form.value.text.trim() && !pending.value)
/** 可见范围切换项；label 用于界面展示，value 保持后端 DTO 的 scope 枚举值 */
const scopeOptions: Array<{ label: string; value: Log['scope'] }> = [
  { label: '私密', value: 'PRIVATE' },
  { label: '公开', value: 'PUBLIC' },
]

watch(
  () => props.initialValue,
  (value) => {
    form.value = { scope: 'PRIVATE', text: '', ...value }
    medias.value = []
  },
)

/** 保存当前正文；有 id 时更新已有 Log，无 id 时创建新 Log */
const onSubmit = async () => {
  if (!canSubmit.value) return
  pending.value = true
  try {
    const text = form.value.text.trim()
    const log = form.value.id
      ? await updateLog({ id: form.value.id, text, scope: form.value.scope })
      : await createLog({
          text,
          scope: form.value.scope,
          logAt: new Date().toISOString(),
        })
    if (form.value.id) {
      logStore.upsert(log)
      form.value = { id: log.id, scope: log.scope, text: log.text }
    } else {
      logStore.upsert(log)
      form.value = { scope: 'PRIVATE', text: '' }
    }
    medias.value = []
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
