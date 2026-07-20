<!--
图片/视频编辑器：
- 默认 model 统一维护既有媒体与带 raw 的本地待上传媒体。
- 用户选择图片后解析拍摄时间和位置，并写入当前媒体 metadata。
- 新旧媒体统一展示、预览和删除，既有视频使用 COS 截帧减少流量。
- 悬停卡片时缩小预览，并在底部显示删除按钮。
- 仅维护编辑状态和本地预览，不负责上传或删除远端资源。
-->
<script lang="ts" setup>
import type { MediaResource } from './utils'
import { toResourceUrl } from 'shared/cos'
import { parseImageMetadata } from 'shared/exifr'
import { ElMessage, type UploadProps, type UploadUserFile } from 'element-plus'
import { Check, Delete, Plus, VideoPlay } from '@element-plus/icons-vue'

/** 媒体编辑列表；本地待上传项通过 `raw` 保留原始 File */
const medias = defineModel<(UploadUserFile & MediaResource)[]>({
  required: true,
})

/** 当前项是否是视频；新增项读取 MIME，既有项读取业务类型 */
const isVideo = (file: UploadUserFile) =>
  file.raw?.type.startsWith('video/') ||
  medias.value.find((item) => item.uid === file.uid)?.type === 'video'

/** 获取媒体展示地址；既有项解析远端 key，本地项直接使用 blob URL */
const previewUrl = (file: UploadUserFile) => {
  if (file.raw) return file.url
  const media = medias.value.find((item) => item.uid === file.uid)
  return toResourceUrl(media?.previewUrl ?? media?.url ?? file.url ?? '')
}

/** 释放本地预览 blob URL，避免反复选文件后残留 */
const revoke = (file: UploadUserFile) => {
  if (!file.url?.startsWith('blob:')) return
  URL.revokeObjectURL(file.url)
}

/** 选择后校验类型并补充业务字段；图片同时解析拍摄 metadata */
const onChange: UploadProps['onChange'] = async (file) => {
  const type = file.raw?.type ?? ''
  if (!type.startsWith('image/') && !type.startsWith('video/')) {
    revoke(file)
    ElMessage.warning('只能添加图片或视频')
    medias.value = medias.value.filter((item) => item.uid !== file.uid)
    return
  }

  Object.assign(file, {
    type: type.startsWith('video/') ? 'video' : 'image',
    url: file.url ?? file.name,
  })

  if (!file.raw || !type.startsWith('image/')) return
  const { takenAt, location } = (await parseImageMetadata(file.raw)) ?? {}
  if (!takenAt && !location) return
  Object.assign(file, { metadata: { takenAt, location } })
}

/** 本地媒体移除时回收预览地址 */
watch(medias, (value, oldValue) => {
  oldValue
    .filter((old) => !value.some((file) => file.uid === old.uid))
    .forEach(revoke)
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
      <div class="item">
        <div class="preview">
          <video
            v-if="file.raw && isVideo(file)"
            class="el-upload-list__item-thumbnail"
            :src="previewUrl(file)"
            muted
            playsinline
            preload="metadata"
          />
          <img
            v-else
            class="el-upload-list__item-thumbnail"
            :src="
              isVideo(file)
                ? `${previewUrl(file)}?ci-process=snapshot&time=0&format=jpg`
                : previewUrl(file)
            "
            alt=""
          />
          <ElIcon v-if="isVideo(file)" class="play"><VideoPlay /></ElIcon>
          <label class="el-upload-list__item-status-label">
            <ElIcon class="el-icon--upload-success el-icon--check">
              <Check />
            </ElIcon>
          </label>
        </div>
        <span class="el-upload-list__item-actions">
          <span
            class="el-upload-list__item-delete"
            @click.stop="
              medias = medias.filter((item) => item.uid !== file.uid)
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
  --size: 96px;

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
        flex-direction: column;
        flex: 1;

        > .preview {
          position: relative;
          display: flex;
          flex: 1;
          min-height: 0;

          > .el-upload-list__item-thumbnail {
            object-fit: cover;
          }

          > .play {
            position: absolute;
            bottom: 8px;
            left: 8px;
            color: #fffe;
          }
        }

        > .el-upload-list__item-actions {
          position: static;
          flex: none;
          height: 0;
          overflow: hidden;
          opacity: 1;
          transition: height var(--el-transition-duration);

          > span {
            display: inline-flex;
          }
        }

        &:hover > .el-upload-list__item-actions {
          height: 24px;
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
}
</style>
