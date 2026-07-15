<script lang="ts" setup>
/** Log 编辑器：新增和编辑共用；每条 Log 使用独立实例，草稿仅在初始化时读取 log */
import type { Log } from '@/api'
import { useLogEditor, type LogEdit } from '@/composables/useLogEditor'
import {
  Clock,
  Document,
  Headset,
  Hide,
  Picture,
  Promotion,
  View,
} from '@element-plus/icons-vue'

const props = defineProps<{
  /** 当前编辑器对应的 Log；不传时创建新 Log */
  log?: Log
}>()

const { logEdit, fileMap, pending, status, submit } = useLogEditor(props.log)

/** 切换草稿字段的启用状态；启用时用传入的初值，关闭时同步清空对应文件缓冲 */
const toggle = <K extends keyof LogEdit>(
  key: K,
  initial: NonNullable<LogEdit[K]>,
) => {
  const enabled = logEdit.value[key] !== undefined
  logEdit.value[key] = (enabled ? undefined : initial) as LogEdit[K]
  if (enabled && key in fileMap) fileMap[key as keyof typeof fileMap] = []
}
</script>

<template>
  <section class="LogEditor m-panel" :inert="pending">
    <ElInput
      v-model="logEdit.text"
      type="textarea"
      :autosize="{ minRows: 3, maxRows: 8 }"
      resize="none"
      placeholder="记录生活，记录你"
      @keydown.meta.enter.prevent="submit"
      @keydown.ctrl.enter.prevent="submit"
    />
    <div class="actions">
      <ElButton
        :icon="Clock"
        :type="logEdit.logAt !== undefined ? 'primary' : 'default'"
        title="记录时间"
        circle
        @click="toggle('logAt', new Date().toISOString())"
      />
      <ElButton
        :icon="Picture"
        :type="logEdit.medias !== undefined ? 'primary' : 'default'"
        title="图片 / 视频"
        circle
        @click="toggle('medias', [])"
      />
      <ElButton
        :icon="Headset"
        :type="logEdit.audios !== undefined ? 'primary' : 'default'"
        title="音频"
        circle
        @click="toggle('audios', [])"
      />
      <ElButton
        :icon="Document"
        :type="logEdit.files !== undefined ? 'primary' : 'default'"
        title="文件"
        circle
        @click="toggle('files', [])"
      />
      <div class="spacer" />
      <ElButton
        :icon="logEdit.scope === 'PUBLIC' ? View : Hide"
        :type="logEdit.scope === 'PUBLIC' ? 'primary' : 'default'"
        title="公开"
        circle
        @click="
          logEdit.scope = logEdit.scope === 'PUBLIC' ? 'PRIVATE' : 'PUBLIC'
        "
      />
      <ElButton
        :icon="Promotion"
        :loading="pending"
        :disabled="!logEdit.text.trim() || pending"
        type="primary"
        round
        @click="submit"
      >
        发送
      </ElButton>
    </div>
    <EditorTime v-if="logEdit.logAt !== undefined" v-model="logEdit.logAt!" />
    <EditorMedias
      v-if="logEdit.medias !== undefined"
      v-model="fileMap.medias"
    />
    <EditorAudios
      v-if="logEdit.audios !== undefined"
      v-model="fileMap.audios"
    />
    <EditorFiles v-if="logEdit.files !== undefined" v-model="fileMap.files" />
    <div v-if="status" class="status">{{ status }}</div>
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

    > .spacer {
      flex: 1;
    }

    // 抵消 Element Plus 内置的 .el-button + .el-button { margin-left: 12px }，间距统一交给 flex gap
    :deep(.el-button + .el-button) {
      margin-left: 0;
    }
  }

  > .status {
    color: #0009;
    font-size: 13px;
  }
}
</style>
