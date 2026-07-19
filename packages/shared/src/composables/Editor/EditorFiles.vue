<!--
文件编辑器：
- 默认 model 维护本轮新增的本地文件，具名 files model 可选传入带 url 的既有资源。
- 新旧文件合并交给 ElUpload 展示和删除，操作后自动同步拆回各自 model。
- 仅维护编辑状态，不负责上传文件或删除远端资源。
-->
<script lang="ts" setup generic="T extends Resource">
import { computedFileList, type Resource } from './utils'
import type { UploadUserFile } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'

/** 本轮新增的本地文件；调用方可从 `raw` 拿原始 File 交给后续流程 */
const fileList = defineModel<UploadUserFile[]>({ required: true })

/** 编辑前就存在的既有资源；用户点删除会直接从这里剔除 */
const files = defineModel<T[]>('files', { default: () => [] })

const _fileList = computedFileList(files, fileList)
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
