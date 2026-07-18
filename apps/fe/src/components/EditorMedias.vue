<!--
图片/视频编辑器：
- 默认 model 维护本轮新增的本地媒体，medias model 可选传入带 url 和 type 的既有媒体。
- 新旧媒体统一展示、预览和删除，操作后自动同步拆回各自 model。
- 仅维护编辑状态和本地预览，不负责上传或删除远端资源。
-->
<script
  lang="ts"
  setup
  generic="T extends FileResource & { type: 'image' | 'video' }"
>
import {
  computedFileList,
  type FileResource,
} from '@/components/EditorFiles.vue'
import type { UploadProps, UploadUserFile } from 'element-plus'
import { Delete, Plus, VideoPlay } from '@element-plus/icons-vue'

/** 本轮新增的图片 / 视频；调用方可从 `raw` 拿原始 File 交给后续流程 */
const fileList = defineModel<UploadUserFile[]>({ required: true })

/** 编辑前已存在的媒体资源；用户点删除会直接从这里剔除 */
const medias = defineModel<T[]>('medias', { default: () => [] })

const _fileList = computedFileList(medias, fileList)

/** 当前项是否是视频（既有附件看 _origin.type，新增看 raw.type） */
const isVideo = (file: (typeof _fileList.value)[number]) =>
  file._origin?.type === 'video' || file.raw?.type.startsWith('video/')

/** 释放本地预览 blob URL，避免反复选文件后残留 */
const revoke = (file: UploadUserFile) => {
  if (!file.url?.startsWith('blob:')) return
  URL.revokeObjectURL(file.url)
}

/** 选择后校验类型；类型不符从列表移除 */
const onChange: UploadProps['onChange'] = (file, files) => {
  const type = file.raw?.type ?? ''
  if (!type.startsWith('image/') && !type.startsWith('video/')) {
    revoke(file)
    ElMessage.warning('只能添加图片或视频')
    _fileList.value = files.filter((item) => item.uid !== file.uid)
    return
  }
}

/** 本地媒体移除时回收预览地址 */
watch(fileList, (value, oldValue) => {
  oldValue
    .filter((old) => !value.some((file) => file.uid === old.uid))
    .forEach(revoke)
})
</script>

<template>
  <ElUpload
    v-model:file-list="_fileList"
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
        v-if="!isVideo(file)"
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
          @click.stop="
            _fileList = _fileList.filter((item) => item.uid !== file.uid)
          "
        >
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
