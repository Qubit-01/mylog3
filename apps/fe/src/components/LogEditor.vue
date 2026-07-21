<script lang="ts" setup>
/** Log 编辑器：新增和编辑共用；每条 Log 使用独立实例，草稿仅在初始化时读取 log */
import type { Log } from '@/api'
import { useLogEditor, type LogEdit } from '@/composables/useLogEditor'
import { EditorAudios, EditorFiles, EditorMedias } from 'shared/Editor'
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

const emit = defineEmits<{
  /** 保存成功时触发，携带保存后的 Log；宿主可据此关闭编辑态或刷新上下文 */
  done: [log: Log]
}>()

const { logEdit, pending, status, submit } = useLogEditor(props.log)

/** 包装 submit：成功则带着保存后的 Log 知会宿主 */
const onSubmit = () => submit().then((saved) => saved && emit('done', saved))

/** 使用媒体拍摄时间覆盖草稿记录时间，并启用记录时间编辑项 */
const onTakenAt = (file: NonNullable<LogEdit['medias']>[number]) => {
  const takenAt = file.metadata?.takenAt
  if (takenAt) logEdit.value.logAt = takenAt
}

/** 切换草稿字段的启用状态；启用时使用传入的初值 */
const toggle = <K extends keyof LogEdit>(
  key: K,
  initial: NonNullable<LogEdit[K]>,
) => {
  const enabled = logEdit.value[key] !== undefined
  logEdit.value[key] = (enabled ? undefined : initial) as LogEdit[K]
}
</script>

<template>
  <!-- 不用 inert：会导致 Chromium 下 ElInput autosize 高度测量异常 -->
  <section class="LogEditor m-panel" :class="{ pending }">
    <ElInput
      v-model.trim="logEdit.text"
      type="textarea"
      :autosize="{ minRows: 3, maxRows: 8 }"
      :readonly="pending"
      resize="none"
      placeholder="记录生活，记录你"
      @keydown.meta.enter.prevent="onSubmit"
      @keydown.ctrl.enter.prevent="onSubmit"
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
        @click="onSubmit"
      >
        发送
      </ElButton>
    </div>

    <template v-if="!pending">
      <EditorTime v-if="logEdit.logAt !== undefined" v-model="logEdit.logAt!" />
      <EditorMedias
        v-if="logEdit.medias !== undefined"
        v-model="logEdit.medias"
        class="swiper-no-swiping"
        :on-taken-at="onTakenAt"
      />
      <EditorAudios
        v-if="logEdit.audios !== undefined"
        v-model="logEdit.audios"
      />
      <EditorFiles v-if="logEdit.files !== undefined" v-model="logEdit.files" />
    </template>
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

  &.pending {
    pointer-events: none;
  }

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
    color: var(--el-text-color-secondary);
    font-size: 13px;
  }
}
</style>
