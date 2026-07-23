<!--
图片/视频编辑器：
- 默认 model 统一维护既有媒体与带 raw 的本地待上传媒体。
- 用户选择图片后解析拍摄时间和位置，并写入当前媒体 metadata。
- 新旧媒体统一展示、预览和删除，既有视频使用 COS 截帧减少流量。
- 上传列表使用 text 模式，媒体卡片在 file slot 中自行展示。
- 超过 10 项时只展示前 8 项和后 2 项，中间使用独立省略图标，避免复用媒体 DOM。
- 本地图片只为当前展示项生成独立预览，避免批量占用 Android 相册 Provider。
- 可选提供拍摄时间回调；传入时显示时间按钮，无拍摄时间的媒体保持禁用。
- 悬停卡片时在预览底部覆盖显示操作按钮。
- 仅维护编辑状态和本地预览，不负责上传或删除远端资源。
-->
<script lang="ts" setup>
import type { MediaResource, UploadMediaFile } from './utils'
import { generateImagePreview } from 'shared/compression'
import { toResourceUrl } from 'shared/cos'
import { stringifyError } from 'shared/error'
import { parseImageMetadata } from 'shared/exifr'
import {
  ElMessage,
  ElNotification,
  type UploadProps,
  type UploadUserFile,
} from 'element-plus'
import {
  Check,
  Clock,
  Delete,
  MoreFilled,
  Plus,
  VideoPlay,
} from '@element-plus/icons-vue'

/** 带业务资源字段和本地派生预览的媒体上传文件 */
type MediaFile = UploadMediaFile & MediaResource

const { onTakenAt } = defineProps<{
  /** 用户选择带拍摄时间的媒体时调用；未传入时不展示时间按钮 */
  onTakenAt?: (file: MediaFile) => void
}>()

/** 媒体编辑列表；本地待上传项通过 `raw` 保留原始 File */
const medias = defineModel<MediaFile[]>({
  required: true,
})

/** 正在生成预览的本地图片；避免列表连续变化时重复处理 */
const processingFiles = new WeakSet<MediaFile>()

/** 组件是否已销毁；异步任务结束后据此丢弃结果 */
let disposed = false

/** 当前项是否是视频；新增项读取 MIME，既有项读取业务类型 */
const isVideo = (file: UploadUserFile) =>
  file.raw?.type.startsWith('video/') || (file as MediaFile).type === 'video'

/** 获取媒体展示地址；既有项解析远端 key，本地项读取已维护的 blob URL */
const previewUrl = (file: UploadUserFile) => {
  if (file.raw) return file.url?.startsWith('blob:') ? file.url : undefined
  const media = file as MediaFile
  return toResourceUrl(media.previewUrl ?? media.url ?? file.url ?? '')
}

/** 释放本地预览 blob URL，避免反复选文件后残留 */
const revoke = (file: MediaFile) => {
  if (file.url?.startsWith('blob:')) URL.revokeObjectURL(file.url)
  if (file.raw) {
    file.url = file.name
    delete file.previewFile
  }
}

/** 当前下标是否属于实际展示的前 8 项或后 2 项 */
const isVisible = (index: number) =>
  medias.value.length <= 10 || index < 8 || index >= medias.value.length - 2

/** 当前本地媒体是否仍在展示范围内 */
const isVisibleLocal = (file: MediaFile) => {
  const index = medias.value.indexOf(file)
  return index >= 0 && isVisible(index)
}

/** 为当前展示的本地图片生成 metadata 和独立预览 */
const processImage = async (file: MediaFile) => {
  const { raw } = file
  if (
    !raw?.type.startsWith('image/') ||
    processingFiles.has(file) ||
    file.url?.startsWith('blob:')
  ) {
    return
  }

  processingFiles.add(file)
  try {
    const metadata = await parseImageMetadata(raw)
    if (metadata) file.metadata = metadata
    if (disposed || !isVisibleLocal(file)) return
    const preview = await generateImagePreview(raw)
    if (!preview || disposed || !isVisibleLocal(file)) return
    file.previewFile = preview
    file.url = URL.createObjectURL(preview)
  } catch (error) {
    if (!disposed && isVisibleLocal(file)) {
      console.error(`生成媒体预览失败：${file.name}`, error)
      ElNotification.error({ message: stringifyError(error), duration: 0 })
    }
  } finally {
    processingFiles.delete(file)
  }
}

/** 选择后只校验类型并补充业务字段；图片读取仅交给可见项 */
const onChange: UploadProps['onChange'] = (_file) => {
  const raw = _file.raw
  const type = raw?.type ?? ''
  if (!raw || (!type.startsWith('image/') && !type.startsWith('video/'))) {
    ElMessage.warning('只能添加图片或视频')
    medias.value = medias.value.filter((item) => item.uid !== _file.uid)
    return
  }

  Object.assign(_file, {
    type: type.startsWith('video/') ? 'video' : 'image',
    url: _file.url ?? _file.name,
  })
}

/** 只处理当前展示的本地媒体，并回收移除或折叠项的地址 */
watch(
  medias,
  (value, oldValue) => {
    for (const old of oldValue ?? []) {
      if (!value.some((file) => file.uid === old.uid)) revoke(old)
    }

    value.forEach((file, index) => {
      if (!file.raw) return
      if (!isVisible(index)) {
        revoke(file)
        return
      }
      if (file.raw.type.startsWith('image/')) {
        processImage(file)
      } else if (!file.url?.startsWith('blob:')) {
        file.url = URL.createObjectURL(file.raw)
      }
    })
  },
  { immediate: true },
)

/** 组件销毁前停止接收异步结果并清空全部派生预览 URL */
onBeforeUnmount(() => {
  disposed = true
  medias.value.forEach(revoke)
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
    <template #trigger>
      <div class="el-upload--picture-card">
        <ElIcon><Plus /></ElIcon>
      </div>
    </template>
    <ElIcon v-if="medias.length > 10" class="ellipsis">
      <MoreFilled />
    </ElIcon>
    <template #file="{ file, index }">
      <template v-if="isVisible(index) && previewUrl(file)">
        <video
          v-if="file.raw && isVideo(file)"
          class="thumbnail"
          :src="`${previewUrl(file)}#t=0.001`"
          muted
          playsinline
          preload="metadata"
        />
        <img
          v-else
          class="thumbnail"
          loading="lazy"
          :src="
            isVideo(file)
              ? `${previewUrl(file)}?ci-process=snapshot&time=0&format=jpg`
              : previewUrl(file)
          "
          alt=""
        />
        <ElIcon v-if="isVideo(file)" class="play"><VideoPlay /></ElIcon>
        <label class="el-upload-list__item-status-label">
          <ElIcon class="check">
            <Check />
          </ElIcon>
        </label>
        <span class="actions">
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
            @click.stop="
              medias = medias.filter((item) => item.uid !== file.uid)
            "
          />
        </span>
      </template>
      <span v-else hidden />
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
    display: contents;

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

      &:nth-child(n + 9):not(:nth-last-child(-n + 2)) {
        display: none;
      }

      > .thumbnail {
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
        width: 40px;
        height: 24px;
        text-align: center;
        background: var(--el-color-success);
        transform: rotate(45deg);

        > .check {
          color: #fff;
          margin-top: 11px;
          font-size: 12px;
          transform: rotate(-45deg);
        }
      }

      > .actions {
        position: absolute;
        right: 0;
        bottom: 0;
        left: 0;
        display: flex;
        align-items: center;
        justify-content: space-evenly;
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

      &:hover > .actions {
        height: 24px;
      }

      &:hover > .el-upload-list__item-status-label {
        display: block;
        opacity: 0;
      }
    }
  }

  > .ellipsis {
    flex: 0 0 24px;
    order: 1;
    height: var(--size);
    color: var(--el-text-color-secondary);
    font-size: 24px;
  }

  // 仅折叠时调整后两项顺序，避免普通新增触发已有卡片重排动画。
  > .ellipsis ~ :deep(.el-upload-list) {
    > .el-upload-list__item:nth-last-child(-n + 2) {
      order: 2;
    }
  }

  :deep(.el-upload) {
    --el-upload-picture-card-size: var(--size);

    flex: none;
    order: 3;
  }
}
</style>
