<script lang="ts" setup>
/** Log 编辑器媒体草稿：只处理浏览器端选图 / 视频、预览和本地资源释放 */
import type { UploadProps, UploadUserFile } from 'element-plus'
import { Delete, Plus, VideoPlay } from '@element-plus/icons-vue'

/** 待提交媒体草稿列表；父级提交流程后续会从这里拿原始 File */
const medias = defineModel<UploadUserFile[]>({ required: true })

/** 判断文件是否是当前编辑器支持的图片或视频 */
const isSupportedMedia = (file: UploadUserFile) =>
  file.raw?.type.startsWith('image/') || file.raw?.type.startsWith('video/')

/** 释放单个本地预览地址，避免反复选文件后残留 blob URL */
const revokeMediaUrl = (file: UploadUserFile) => {
  if (!file.url?.startsWith('blob:')) return
  URL.revokeObjectURL(file.url)
  file.url = undefined
}

/** 选择媒体后生成本地预览；这一阶段只留在浏览器，不上传服务器 */
const onMediaChange: UploadProps['onChange'] = (file, files) => {
  if (!isSupportedMedia(file)) {
    revokeMediaUrl(file)
    ElMessage.warning('只能添加图片或视频')
    medias.value = files.filter((item) => item.uid !== file.uid)
    return
  }

  if (!file.url && file.raw) file.url = URL.createObjectURL(file.raw)
}

/** 自定义缩略图删除入口；用于覆盖 Element Plus 默认图片模板后的删除动作 */
const removeMedia = (file: UploadUserFile) => {
  medias.value = medias.value.filter((item) => item.uid !== file.uid)
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
  >
    <ElIcon><Plus /></ElIcon>
    <template #file="{ file }">
      <img
        v-if="file.raw?.type.startsWith('image/')"
        class="el-upload-list__item-thumbnail"
        :src="file.url"
        alt=""
      />
      <template v-else>
        <video
          class="el-upload-list__item-thumbnail"
          :src="file.url"
          muted
          playsinline
          preload="metadata"
        />
        <ElIcon class="play"><VideoPlay /></ElIcon>
      </template>
      <span class="el-upload-list__item-actions">
        <span
          class="el-upload-list__item-delete"
          @click.stop="removeMedia(file)"
        >
          <ElIcon><Delete /></ElIcon>
        </span>
      </span>
    </template>
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

  :deep(.play) {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    color: #fffe;
    font-size: 24px;
    background: #0003;
  }
}
</style>
