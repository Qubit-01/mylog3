<!--
音频编辑器：
- audios model 维护 Log 音频列表，本地待上传项同时保存原始文件名。
- 默认 model 维护带 raw 的真实本地音频，供最终发布时上传。
- 新旧音频统一展示、试听和删除，操作后立即同步两个 model。
- 仅维护编辑状态和本地试听地址，不负责上传或删除远端资源。
-->
<script lang="ts" setup>
import { computedFileList, type AudioResource } from './utils'
import { ElMessage, type UploadProps, type UploadUserFile } from 'element-plus'
import { Delete, Plus } from '@element-plus/icons-vue'

/** 真实的本地待上传音频；调用方可从 `raw` 取原始 File */
const fileList = defineModel<UploadUserFile[]>({ required: true })

/** Log 音频列表；本地项在发布前暂用文件名作为 url */
const audios = defineModel<AudioResource[]>('audios', { default: () => [] })

const _fileList = computedFileList(audios, fileList, (file) => ({
  type: 'audio',
  name: file.name,
  url: file.name,
}))

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
  _fileList.value = files
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
        <div class="meta">
          <span class="name">{{ file.name }}</span>
          <span
            class="delete"
            @click.stop="
              _fileList = _fileList.filter((item) => item.uid !== file.uid)
            "
          >
            <ElIcon><Delete /></ElIcon>
          </span>
        </div>
        <audio :src="file.url" controls preload="none" />
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
      margin: 0;
    }
  }

  .item {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 4px;

    > .meta {
      display: flex;
      align-items: center;

      > .name {
        flex: 1;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      > .delete {
        flex: none;
        padding: 4px;
        cursor: pointer;
      }
    }

    > audio {
      width: 100%;
      height: 32px;
    }
  }
}
</style>
