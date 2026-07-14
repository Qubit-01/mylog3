<script lang="ts" setup>
/** 音频编辑器：浏览器端选择、试听、删除，仅维护本地文件列表，不涉及上传 */
import type { UploadProps, UploadUserFile } from 'element-plus'
import { Delete, Plus } from '@element-plus/icons-vue'

/** 当前编辑的音频列表；调用方可从 `raw` 拿原始 File 交给后续流程 */
const audios = defineModel<UploadUserFile[]>({ required: true })

/** 释放本地试听 blob URL，避免反复选文件后残留 */
const revoke = (file: UploadUserFile) => {
  if (!file.url?.startsWith('blob:')) return
  URL.revokeObjectURL(file.url)
  file.url = undefined
}

/** 选择后生成本地试听地址；这一阶段只留在浏览器 */
const onChange: UploadProps['onChange'] = (file, files) => {
  if (!file.raw?.type.startsWith('audio/')) {
    ElMessage.warning('只能添加音频')
    audios.value = files.filter((item) => item.uid !== file.uid)
    return
  }

  if (!file.url && file.raw) file.url = URL.createObjectURL(file.raw)
}

/** 自定义列表删除入口；用于覆盖 Element Plus 默认文件模板后的删除动作 */
const remove = (file: UploadUserFile) => {
  audios.value = audios.value.filter((item) => item.uid !== file.uid)
}

/** 外部清空音频列表时，回收已经移除的本地试听地址 */
watch(audios, (value, oldValue) => {
  oldValue
    ?.filter((old) => !value.some((file) => file.uid === old.uid))
    .forEach(revoke)
})

onUnmounted(() => {
  audios.value.forEach(revoke)
})
</script>

<template>
  <ElUpload
    v-model:file-list="audios"
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
        <ElButton :icon="Delete" text @click.stop="remove(file)" />
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
