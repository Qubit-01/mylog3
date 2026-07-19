<!--
图片/视频编辑器：
- medias model 维护 Log 媒体列表，本地待上传项暂用文件名作为 url。
- 默认 model 维护带 raw 的真实本地媒体，供最终发布时上传。
- 新旧媒体统一展示、预览和删除，已上传项显示成功状态标记。
- 删除操作需先点击卡片聚焦，再点击删除图标，不依赖 hover。
- 选择或删除后立即同步两个 model。
- 仅维护编辑状态和本地预览，不负责上传或删除远端资源。
-->
<script lang="ts" setup>
import { computedFileList, type MediaResource } from './utils'
import { ElMessage, type UploadProps, type UploadUserFile } from 'element-plus'
import { Check, Delete, Plus, VideoPlay } from '@element-plus/icons-vue'

/** 真实的本地待上传图片 / 视频；调用方可从 `raw` 取原始 File */
const fileList = defineModel<UploadUserFile[]>({ required: true })

/** Log 媒体列表；本地项在发布前以文件名暂存 url */
const medias = defineModel<MediaResource[]>('medias', { default: () => [] })

const _fileList = computedFileList(medias, fileList, (file) => ({
  type: file.raw?.type.startsWith('video/') ? 'video' : 'image',
  url: file.name,
}))

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
      <div class="item" tabindex="0">
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
        <label class="el-upload-list__item-status-label">
          <ElIcon class="el-icon--upload-success el-icon--check">
            <Check />
          </ElIcon>
        </label>
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
      </div>
    </template>
  </ElUpload>
</template>

<style lang="scss" scoped>
.EditorMedias {
  --size: 72px;

  display: flex;
  max-width: 100%;
  overflow: auto hidden;

  :deep(.el-upload-list) {
    flex-wrap: nowrap;
    gap: 4px;

    > .el-upload-list__item {
      flex: none;
      width: var(--size);
      height: var(--size);
      margin: 0;

      > .item {
        display: flex;
        flex: 1;
        outline: none;

        > .el-upload-list__item-thumbnail {
          object-fit: cover;
        }

        > .el-upload-list__item-actions {
          visibility: hidden;
        }

        &:focus-within > .el-upload-list__item-actions {
          visibility: visible;
          opacity: 1;

          > span {
            display: inline-flex;
          }
        }
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
