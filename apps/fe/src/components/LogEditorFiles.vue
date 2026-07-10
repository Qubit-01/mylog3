<script lang="ts" setup>
/** Log 编辑器文件草稿：只处理浏览器端选文件和删除 */
import type { UploadUserFile } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'

/** 浏览器端待提交文件；raw 是原始 File */
export type LogEditorFile = UploadUserFile

/** 待提交文件草稿列表；父级提交流程后续会从这里拿原始 File */
const files = defineModel<LogEditorFile[]>({ required: true })
</script>

<template>
  <ElUpload
    v-model:file-list="files"
    class="LogEditorFiles"
    multiple
    :auto-upload="false"
  >
    <ElButton :icon="Plus">添加文件</ElButton>
  </ElUpload>
</template>

<style lang="scss" scoped>
.LogEditorFiles {
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
