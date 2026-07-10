<script lang="ts" setup>
/** Log 编辑器音频草稿：处理浏览器端选音频、试听和本地资源释放 */
import type { UploadProps, UploadUserFile } from 'element-plus'
import { Delete, Plus } from '@element-plus/icons-vue'

/** 浏览器端待提交音频；raw 是原始 File，url 是本地试听地址 */
export type LogEditorAudio = UploadUserFile

/** 待提交音频草稿列表；父级提交流程后续会从这里拿原始 File */
const audios = defineModel<LogEditorAudio[]>({ required: true })

/** 释放单个本地试听地址，避免反复选文件后残留 blob URL */
const revokeAudioUrl = (file: LogEditorAudio) => {
  if (!file.url?.startsWith('blob:')) return
  URL.revokeObjectURL(file.url)
  file.url = undefined
}

/** 选择音频后生成本地试听地址；这一阶段只留在浏览器，不上传服务器 */
const onAudioChange: UploadProps['onChange'] = (file, files) => {
  if (!file.raw?.type.startsWith('audio/')) {
    ElMessage.warning('只能添加音频')
    audios.value = files.filter((item) => item.uid !== file.uid)
    return
  }

  if (!file.url && file.raw) file.url = URL.createObjectURL(file.raw)
}

/** 自定义列表删除入口；用于覆盖 Element Plus 默认文件模板后的删除动作 */
const removeAudio = (file: LogEditorAudio) => {
  audios.value = audios.value.filter((item) => item.uid !== file.uid)
}

/** 外部清空音频列表时，回收已经移除的本地试听地址 */
watch(audios, (value, oldValue) => {
  oldValue
    ?.filter((oldFile) => !value.some((file) => file.uid === oldFile.uid))
    .forEach(revokeAudioUrl)
})

onUnmounted(() => {
  audios.value.forEach(revokeAudioUrl)
})
</script>

<template>
  <ElUpload
    v-model:file-list="audios"
    class="LogEditorAudios"
    accept="audio/*"
    multiple
    :auto-upload="false"
    :on-change="onAudioChange"
  >
    <ElButton :icon="Plus">添加音频</ElButton>
    <template #file="{ file }">
      <div class="item">
        <audio :src="file.url" controls preload="metadata" />
        <span class="name">{{ file.name }}</span>
        <ElButton :icon="Delete" text @click.stop="removeAudio(file)" />
      </div>
    </template>
  </ElUpload>
</template>

<style lang="scss" scoped>
.LogEditorAudios {
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
