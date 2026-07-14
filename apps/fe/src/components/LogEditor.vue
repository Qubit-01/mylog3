<script lang="ts" setup>
/** Log 编辑器：新增和编辑共用；每条 Log 使用独立实例，草稿仅在初始化时读取 log */
import type { Log } from '@/api'
import { useLogEditor } from '@/composables/useLogEditor'
import { Document, Headset, Picture, Promotion } from '@element-plus/icons-vue'

const props = defineProps<{
  /** 当前编辑器对应的 Log；不传时创建新 Log */
  log?: Log
}>()

const { logEdit, fileMap, pending, uploadInfo, submit } = useLogEditor(
  props.log,
)

/** 切换附件编辑器启用状态；关闭时同步清空本地文件缓冲，避免残留 blob 与 File */
const toggle = (key: 'medias' | 'audios' | 'files') => {
  if (logEdit.value[key] === undefined) {
    logEdit.value[key] = []
  } else {
    logEdit.value[key] = undefined
    fileMap[key] = []
  }
}
</script>

<template>
  <section class="LogEditor m-panel" :inert="pending">
    <ElInput
      v-model="logEdit.text"
      type="textarea"
      :autosize="{ minRows: 3, maxRows: 8 }"
      resize="none"
      maxlength="2000"
      show-word-limit
      placeholder="记录点什么..."
      @keydown.meta.enter.prevent="submit"
      @keydown.ctrl.enter.prevent="submit"
    />
    <div class="actions">
      <div class="attachments">
        <ElButton
          :icon="Picture"
          :type="logEdit.medias !== undefined ? 'primary' : 'default'"
          title="图片 / 视频"
          circle
          text
          @click="toggle('medias')"
        />
        <ElButton
          :icon="Headset"
          :type="logEdit.audios !== undefined ? 'primary' : 'default'"
          title="音频"
          circle
          text
          @click="toggle('audios')"
        />
        <ElButton
          :icon="Document"
          :type="logEdit.files !== undefined ? 'primary' : 'default'"
          title="文件"
          circle
          text
          @click="toggle('files')"
        />
      </div>
      <ElSegmented
        v-model="logEdit.scope"
        :options="[
          { label: '私密', value: 'PRIVATE' },
          { label: '公开', value: 'PUBLIC' },
        ]"
        size="small"
      />
      <ElButton
        :icon="Promotion"
        :loading="pending"
        :disabled="!logEdit.text.trim() || pending"
        type="primary"
        circle
        @click="submit"
      />
    </div>
    <EditorMedias
      v-if="logEdit.medias !== undefined"
      v-model="fileMap.medias"
    />
    <EditorAudios
      v-if="logEdit.audios !== undefined"
      v-model="fileMap.audios"
    />
    <EditorFiles v-if="logEdit.files !== undefined" v-model="fileMap.files" />
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
    gap: 8px;

    > .attachments {
      display: flex;
      margin-right: auto;
      gap: 4px;
    }
  }
}
</style>
