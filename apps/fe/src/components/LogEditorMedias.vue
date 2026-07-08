<script lang="ts" setup>
/** Log 编辑器媒体草稿：只处理浏览器端选图 / 视频、预览和本地资源释放 */
import type { UploadProps, UploadUserFile } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'

/** 浏览器端待提交媒体；raw 是原始 File，url 是本地预览地址 */
export type LogEditorMedia = UploadUserFile

/** 待提交媒体草稿列表；父级提交流程后续会从这里拿原始 File */
const medias = defineModel<LogEditorMedia[]>({ required: true })

/** 判断文件是否是当前编辑器支持的媒体类型 */
const isMedia = (file: LogEditorMedia) =>
  !!file.raw?.type &&
  (file.raw.type.startsWith('image/') || file.raw.type.startsWith('video/'))

/** 释放单个本地预览地址，避免反复选文件后残留 blob URL */
const revokeMediaUrl = (file: LogEditorMedia) => {
  if (!file.url?.startsWith('blob:')) return
  URL.revokeObjectURL(file.url)
  file.url = undefined
}

/** 选择媒体后生成本地预览；这一阶段只留在浏览器，不上传服务器 */
const onMediaChange: UploadProps['onChange'] = (file, files) => {
  if (!isMedia(file)) {
    revokeMediaUrl(file)
    ElMessage.warning('只能添加图片或视频')
    medias.value = files.filter((item) => item.uid !== file.uid)
    return
  }

  if (!file.url && file.raw) file.url = URL.createObjectURL(file.raw)
}

/** 删除媒体时同步释放本地预览地址 */
const onMediaRemove: UploadProps['onRemove'] = (file) => {
  revokeMediaUrl(file)
}

/** 外部清空媒体列表时，回收已经移除的本地预览地址 */
watch(medias, (value, oldValue) => {
  oldValue
    ?.filter((oldFile) => !value.some((file) => file.uid === oldFile.uid))
    .forEach(revokeMediaUrl)
})

onUnmounted(() => {
  medias.value.forEach(revokeMediaUrl)
})
</script>

<template>
  <ElUpload
    v-model:file-list="medias"
    class="LogEditorMedias"
    list-type="picture-card"
    accept="image/*,video/*"
    multiple
    :auto-upload="false"
    :on-change="onMediaChange"
    :on-remove="onMediaRemove"
  >
    <ElIcon><Plus /></ElIcon>
  </ElUpload>
</template>

<style lang="scss" scoped>
.LogEditorMedias {
  --size: 72px;

  display: flex;
  max-width: 100%;
  overflow: auto;

  :deep(.el-upload-list) {
    flex-wrap: nowrap;
    gap: 4px;

    > .el-upload-list__item {
      width: var(--size);
      height: var(--size);
      margin: 0;
    }
  }

  :deep(.el-upload) {
    width: var(--size);
    height: var(--size);
    flex: none;
    margin: 0;
  }
}
</style>
