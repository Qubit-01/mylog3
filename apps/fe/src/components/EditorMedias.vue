<script lang="ts" setup>
/** 图片/视频编辑器：浏览器端选择、预览、删除，仅维护本地文件列表，不涉及上传 */
import type { UploadProps, UploadUserFile } from 'element-plus'
import { Delete, Plus, VideoPlay } from '@element-plus/icons-vue'

/** 当前编辑的图片 / 视频列表；调用方可从 `raw` 拿原始 File 交给后续流程 */
const medias = defineModel<UploadUserFile[]>({ required: true })

/** 判断是否是支持的图片或视频 */
const isMedia = (file: UploadUserFile) =>
  file.raw?.type.startsWith('image/') || file.raw?.type.startsWith('video/')

/** 释放本地预览 blob URL，避免反复选文件后残留 */
const revoke = (file: UploadUserFile) => {
  if (!file.url?.startsWith('blob:')) return
  URL.revokeObjectURL(file.url)
  file.url = undefined
}

/** 选择后生成本地预览地址；这一阶段只留在浏览器 */
const onChange: UploadProps['onChange'] = (file, files) => {
  if (!isMedia(file)) {
    revoke(file)
    ElMessage.warning('只能添加图片或视频')
    medias.value = files.filter((item) => item.uid !== file.uid)
    return
  }

  if (!file.url && file.raw) file.url = URL.createObjectURL(file.raw)
}

/** 自定义缩略图删除入口；用于覆盖 Element Plus 默认图片模板后的删除动作 */
const remove = (file: UploadUserFile) => {
  medias.value = medias.value.filter((item) => item.uid !== file.uid)
}

/** 外部清空媒体列表时，回收已经移除的本地预览地址 */
watch(medias, (value, oldValue) => {
  oldValue
    ?.filter((old) => !value.some((file) => file.uid === old.uid))
    .forEach(revoke)
})

onUnmounted(() => {
  medias.value.forEach(revoke)
})
</script>

<template>
  <ElUpload
    v-model:file-list="medias"
    class="EditorMedias"
    list-type="picture-card"
    accept="image/*,video/*"
    multiple
    :auto-upload="false"
    :on-change="onChange"
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
        <span class="el-upload-list__item-delete" @click.stop="remove(file)">
          <ElIcon><Delete /></ElIcon>
        </span>
      </span>
    </template>
  </ElUpload>
</template>

<style lang="scss" scoped>
.EditorMedias {
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

      > img,
      > video {
        object-fit: cover;
      }
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
    bottom: 8px;
    left: 8px;
    color: #fffe;
  }
}
</style>
