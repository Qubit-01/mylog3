<script lang="ts" setup>
/** Log 编辑器视图：新增和编辑共用，业务状态与保存事务由 useLogEditor 管理 */
import type { Log } from '@/api'
import { useLogEditor } from '@/composables/useLogEditor'
import { Promotion } from '@element-plus/icons-vue'

const props = defineProps<{
  /** 初始完整 Log；每个组件实例只读取一次，不传时创建新 Log */
  initialValue?: Log
}>()

const { draft, fileMap, pending, submit } = useLogEditor(props.initialValue)
</script>

<template>
  <section class="LogEditor m-panel">
    <ElInput
      v-model="draft.text"
      type="textarea"
      :autosize="{ minRows: 3, maxRows: 8 }"
      resize="none"
      maxlength="2000"
      show-word-limit
      placeholder="记录点什么..."
      @keydown.meta.enter.prevent="submit"
      @keydown.ctrl.enter.prevent="submit"
    />
    <div class="uploads">
      <LogEditorMedias v-model="fileMap.medias" />
      <LogEditorAudios v-model="fileMap.audios" />
      <LogEditorFiles v-model="fileMap.files" />
    </div>
    <div class="actions">
      <ElSegmented
        v-model="draft.scope"
        :options="[
          { label: '私密', value: 'PRIVATE' },
          { label: '公开', value: 'PUBLIC' },
        ]"
        size="small"
      />
      <ElButton
        :icon="Promotion"
        :loading="pending"
        :disabled="!draft.text.trim() || pending"
        type="primary"
        circle
        @click="submit"
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
  }
}
</style>
