<script lang="ts" setup>
/** Log 编辑器：新增和编辑共用；每条 Log 使用独立实例，草稿仅在初始化时读取 log */
import type { Log } from '@/api'
import { useLogEditor } from '@/composables/useLogEditor'
import { Promotion } from '@element-plus/icons-vue'

const props = defineProps<{
  /** 当前编辑器对应的 Log；不传时创建新 Log */
  log?: Log
}>()

const { draft, fileMap, pending, uploadInfo, submit } = useLogEditor(props.log)
</script>

<template>
  <section class="LogEditor m-panel" :inert="pending">
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
    <ElProgress
      v-if="uploadInfo.percent > -1"
      :percentage="uploadInfo.percent"
      :text-inside="true"
      :stroke-width="20"
      striped
      striped-flow
      :duration="10"
    >
      {{ uploadInfo.percent }}% {{ uploadInfo.speed }}MB/s
    </ElProgress>
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
