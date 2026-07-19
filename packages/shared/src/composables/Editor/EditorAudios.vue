<!--
音频编辑器：
- 默认 model 维护本轮新增的本地音频，audios model 可选传入带 url 的既有音频。
- 新旧音频统一展示、试听和删除，操作后自动同步拆回各自 model。
- 仅维护编辑状态和本地试听地址，不负责上传或删除远端资源。
-->
<script lang="ts" setup generic="T extends Resource">
import { computedFileList, type Resource } from './utils'
import { ElMessage, type UploadProps, type UploadUserFile } from 'element-plus'
import { Delete, Plus } from '@element-plus/icons-vue'

/** 本轮新增的音频；调用方可从 `raw` 拿原始 File 交给后续流程 */
const fileList = defineModel<UploadUserFile[]>({ required: true })

/** 编辑前已存在的音频资源；用户点删除会直接从这里剔除 */
const audios = defineModel<T[]>('audios', { default: () => [] })

const _fileList = computedFileList(audios, fileList)

/** 释放本地试听 blob URL，避免反复选文件后残留 */
const revoke = (file: UploadUserFile) => {
  if (!file.url?.startsWith('blob:')) return
  URL.revokeObjectURL(file.url)
  file.url = undefined
}

/** 选择后校验类型并生成本地试听地址；类型不符直接把它从列表移除 */
const onChange: UploadProps['onChange'] = (file, files) => {
  if (!file.raw?.type.startsWith('audio/')) {
    ElMessage.warning('只能添加音频')
    _fileList.value = files.filter((item) => item.uid !== file.uid)
    return
  }
  file.url ||= URL.createObjectURL(file.raw)
}

/** 本地音频移除时回收试听地址 */
watch(fileList, (value, oldValue) => {
  oldValue
    ?.filter((old) => !value.some((file) => file.uid === old.uid))
    .forEach(revoke)
})

onUnmounted(() => {
  fileList.value.forEach(revoke)
})
</script>

<template>
  <ElUpload
    v-model:file-list="_fileList"
    class="EditorAudios"
    accept="audio/*"
    multiple
    :auto-upload="false"
    :on-change="onChange"
  >
    <ElButton :icon="Plus">添加音频</ElButton>
    <template #file="{ file }">
      <div class="item">
        <audio :src="file.url" controls preload="metadata" />
        <span class="name">{{ file.name }}</span>
        <ElButton
          :icon="Delete"
          text
          @click.stop="
            _fileList = _fileList.filter((item) => item.uid !== file.uid)
          "
        />
      </div>
    </template>
  </ElUpload>
</template>

<style lang="scss" scoped>
.EditorAudios {
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
      height: auto;
      margin: 0;
    }
  }

  .item {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;

    > audio {
      height: 28px;
      max-width: 240px;
    }

    > .name {
      overflow: hidden;
      color: #606266;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    > :deep(.el-button) {
      flex: none;
    }
  }
}
</style>
