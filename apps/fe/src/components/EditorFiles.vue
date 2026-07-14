<script lang="ts" setup>
/** 文件编辑器：浏览器端选择、删除，仅维护本地文件列表，不涉及上传 */
import type { UploadUserFile } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'

/** 当前编辑的文件列表；调用方可从 `raw` 拿原始 File 交给后续流程 */
const files = defineModel<UploadUserFile[]>({ required: true })
</script>

<template>
  <ElUpload
    v-model:file-list="files"
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
