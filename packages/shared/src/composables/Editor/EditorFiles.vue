<!--
文件编辑器：
- files model 维护 Log 文件列表，本地待上传项同时保存原始文件名。
- 默认 model 维护带 raw 的真实本地文件，供最终发布时上传。
- 新旧文件统一交给 ElUpload 展示和删除，选择或删除后立即同步两个 model。
- 仅维护编辑状态，不负责上传文件或删除远端资源。
-->
<script lang="ts" setup>
import { computedFileList, type FileResource } from './utils'
import type { UploadUserFile } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'

/** 真实的本地待上传文件；调用方可从 `raw` 取原始 File */
const fileList = defineModel<UploadUserFile[]>({ required: true })

/** Log 文件列表；本地项在发布前暂用文件名作为 url */
const files = defineModel<FileResource[]>('files', { default: () => [] })

const _fileList = computedFileList(files, fileList, (file) => ({
  type: 'file',
  name: file.name,
  url: file.name,
}))
</script>

<template>
  <ElUpload
    v-model:file-list="_fileList"
    class="EditorFiles"
    multiple
    :auto-upload="false"
  >
    <ElButton :icon="Plus">添加文件</ElButton>
  </ElUpload>
</template>

<style lang="scss" scoped>
.EditorFiles {
  display: flex;
  flex-direction: column;
  gap: 4px;

  :deep(.el-upload) {
    align-self: flex-start;
  }

  :deep(.el-upload-list) {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin: 0;

    > .el-upload-list__item {
      margin: 0;
    }
  }
}
</style>
