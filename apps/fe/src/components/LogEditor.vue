<script lang="ts" setup>
/** Log 编辑器：新增和编辑共用的正文表单，空值用于新增，已有值用于编辑 */
import { createLog, type Log, updateLog } from '@/api'
import { useLogStore } from '@/stores/log'
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
const pending = ref(false)
const editing = computed(() => !!form.value.id)
const canSubmit = computed(() => !!form.value.text.trim() && !pending.value)

watch(
  () => props.initialValue,
  (value) => {
    form.value = { scope: 'PRIVATE', text: '', ...value }
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
    <div class="actions">
      <ElRadioGroup v-model="form.scope" size="small" aria-label="可见范围">
        <ElRadioButton value="PRIVATE">私密</ElRadioButton>
        <ElRadioButton value="PUBLIC">公开</ElRadioButton>
      </ElRadioGroup>
      <ElButton
        :icon="Promotion"
        :loading="pending"
        :disabled="!canSubmit"
        type="primary"
        @click="onSubmit"
      >
        {{ editing ? '保存' : '发布' }}
      </ElButton>
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
    justify-content: flex-end;
    gap: 8px;
  }
}
</style>
