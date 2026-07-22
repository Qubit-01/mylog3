<!--
图片/视频编辑器：
- 默认 model 统一维护既有媒体与带 raw 的本地待上传媒体。
- 用户选择图片后解析拍摄时间和位置，并写入当前媒体 metadata。
- 新旧媒体统一展示、预览和删除，既有视频使用 COS 截帧减少流量。
- 上传列表使用 text 模式，媒体卡片由组件自行展示。
- 可选提供拍摄时间回调；传入时显示时间按钮，无拍摄时间的媒体保持禁用。
- 悬停卡片时缩小预览，并在底部显示删除按钮。
- 仅维护编辑状态和本地预览，不负责上传或删除远端资源。
-->
<script lang="ts" setup>
import type { MediaResource } from './utils'
import { toResourceUrl } from 'shared/cos'
import { parseImageMetadata } from 'shared/exifr'
import { ElMessage, type UploadProps, type UploadUserFile } from 'element-plus'
import { Check, Clock, Delete, Plus, VideoPlay } from '@element-plus/icons-vue'

/** 带业务资源字段的媒体上传文件 */
type MediaFile = UploadUserFile & MediaResource

const { onTakenAt } = defineProps<{
  /** 用户选择带拍摄时间的媒体时调用；未传入时不展示时间按钮 */
  onTakenAt?: (file: MediaFile) => void
}>()

/** 媒体编辑列表；本地待上传项通过 `raw` 保留原始 File */
const medias = defineModel<MediaFile[]>({
  required: true,
})

/** 当前项是否是视频；新增项读取 MIME，既有项读取业务类型 */
const isVideo = (file: UploadUserFile) =>
  file.raw?.type.startsWith('video/') || (file as MediaFile).type === 'video'

/** 获取媒体展示地址；既有项解析远端 key，本地项直接使用 blob URL */
const previewUrl = (file: UploadUserFile) => {
  if (file.raw) return file.url
  const media = file as MediaFile
  return toResourceUrl(media.previewUrl ?? media.url ?? file.url ?? '')
}

/** 释放本地预览 blob URL，避免反复选文件后残留 */
const revoke = (file: UploadUserFile) => {
  if (!file.url?.startsWith('blob:')) return
  URL.revokeObjectURL(file.url)
}

/** 选择后校验类型、生成本地预览并补充业务字段；图片同时解析拍摄 metadata */
const onChange: UploadProps['onChange'] = async (_file) => {
  const raw = _file.raw
  const type = raw?.type ?? ''
  if (!raw || (!type.startsWith('image/') && !type.startsWith('video/'))) {
    ElMessage.warning('只能添加图片或视频')
    medias.value = medias.value.filter((item) => item.uid !== _file.uid)
    return
  }

  Object.assign(_file, {
    type: type.startsWith('video/') ? 'video' : 'image',
    // text 模式不会像 picture-card 一样自动创建 blob URL，需要在此维护预览地址。
    url: _file.url ?? URL.createObjectURL(raw),
  })

  if (!type.startsWith('image/')) return
  const { takenAt, location } = (await parseImageMetadata(raw)) ?? {}
  if (!takenAt && !location) return
  const media = medias.value.find((item) => item.uid === _file.uid)
  if (media) media.metadata = { takenAt, location }
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
    list-type="text"
    accept="image/*,video/*"
    multiple
    :auto-upload="false"
    :on-change="onChange"
  >
    <div class="el-upload--picture-card">
      <ElIcon><Plus /></ElIcon>
    </div>
    <template #file="{ file }">
      <template v-if="file.url">
        <video
          v-if="file.raw && isVideo(file)"
          class="el-upload-list__item-thumbnail"
          :src="`${previewUrl(file)}#t=0.001`"
          muted
          playsinline
          preload="metadata"
        />
        <img
          v-else
          class="el-upload-list__item-thumbnail"
          loading="lazy"
          :src="
            isVideo(file)
              ? `${previewUrl(file)}?ci-process=snapshot&time=0&format=jpg`
              : previewUrl(file)
          "
          alt=""
        />
        <ElIcon v-if="isVideo(file)" class="play"><VideoPlay /></ElIcon>
      </template>
      <label class="el-upload-list__item-status-label">
        <ElIcon class="el-icon--upload-success el-icon--check">
          <Check />
        </ElIcon>
      </label>
      <span class="el-upload-list__item-actions">
        <ElButton
          v-if="onTakenAt"
          :icon="Clock"
          :disabled="!(file as MediaFile).metadata?.takenAt"
          link
          @click.stop="onTakenAt?.(file as MediaFile)"
        />
        <ElButton
          :icon="Delete"
          link
          @click.stop="medias = medias.filter((item) => item.uid !== file.uid)"
        />
      </span>
    </template>
  </ElUpload>
</template>

<style lang="scss" scoped>
.EditorMedias {
  --size: 96px;

  display: flex;
  gap: 4px;
  max-width: 100%;
  overflow: auto hidden;

  :deep(.el-upload-list) {
    display: flex;
    flex: none;
    gap: 4px;
    margin: 0;

    > .el-upload-list__item {
      display: flex;
      flex-direction: column;
      flex: none;
      width: var(--size);
      height: var(--size);
      overflow: hidden;
      margin: 0;
      background: var(--el-fill-color-blank);
      border: 1px solid var(--el-border-color);
      border-radius: 6px;

      > .el-upload-list__item-thumbnail {
        flex: 1;
        width: 100%;
        min-height: 0;
        object-fit: cover;
      }

      > .play {
        position: absolute;
        bottom: 8px;
        left: 8px;
        color: #fffe;
      }

      > .el-upload-list__item-status-label {
        top: -6px;
        right: -15px;
        align-items: flex-end;
        justify-content: center;
        width: 40px;
        height: 24px;
        padding-bottom: 1px;
        background: var(--el-color-success);
        transform: rotate(45deg);

        > .el-icon--check {
          color: #fff;
          font-size: 12px;
          transform: rotate(-45deg);
        }
      }

      > .el-upload-list__item-actions {
        display: flex;
        align-items: center;
        justify-content: space-evenly;
        flex: none;
        height: 0;
        overflow: hidden;
        color: #fff;
        background: #0009;
        transition: height var(--el-transition-duration);

        > .el-button {
          margin: 0;
          color: inherit;

          &.is-disabled {
            color: #fff6;
          }
        }
      }

      &:hover > .el-upload-list__item-actions {
        height: 24px;
      }
    }
  }

  :deep(.el-upload) {
    --el-upload-picture-card-size: var(--size);

    flex: none;
    order: 1;
  }
}
</style>
