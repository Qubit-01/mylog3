<!--
文件编辑器：
- 默认 model 统一维护既有文件与带 raw 的本地待上传文件。
- 新旧文件统一展示和删除。
- 仅维护编辑状态，不负责上传文件或删除远端资源。
-->
<script lang="ts" setup>
import type { FileResource } from './utils'
import type { UploadProps, UploadUserFile } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'

/** 带业务资源字段的普通上传文件 */
type FileFile = UploadUserFile & FileResource

/** 文件编辑列表；本地待上传项通过 `raw` 保留原始 File */
const files = defineModel<FileFile[]>({ required: true })

/** 选择后补充业务类型与上传前的占位地址 */
const onChange: UploadProps['onChange'] = (_file) => {
  const file = files.value.find((item) => item.uid === _file.uid)
  if (!file) return
  Object.assign(file, { type: 'file', url: file.url ?? file.name })
}
</script>

<template>
  <ElUpload
    v-model:file-list="files"
    class="EditorFiles"
    multiple
    :auto-upload="false"
    :on-change="onChange"
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
