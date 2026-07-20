<!--
音频编辑器：
- 默认 model 统一维护既有音频与带 raw 的本地待上传音频。
- 新旧音频统一展示、试听和删除。
- 音频项结构与样式尽量跟随 LogCardAudios，编辑态仅额外提供添加与删除能力。
- 仅维护编辑状态和本地试听地址，不负责上传或删除远端资源。
-->
<script lang="ts" setup>
import type { AudioResource } from './utils'
import { toResourceUrl } from 'shared/cos'
import { vEllipsis } from 'shared/ellipsis'
import { ElMessage, type UploadProps, type UploadUserFile } from 'element-plus'
import { Delete, Headset, Plus } from '@element-plus/icons-vue'

/** 带业务资源字段的音频上传文件 */
type AudioFile = UploadUserFile & AudioResource

/** 音频编辑列表；本地待上传项通过 `raw` 保留原始 File */
const audios = defineModel<AudioFile[]>({
  required: true,
})

/** 获取音频试听地址；既有项解析远端 key，本地项直接使用 blob URL */
const audioUrl = (file: UploadUserFile) => {
  if (file.raw) return file.url
  const audio = audios.value.find((item) => item.uid === file.uid)
  return toResourceUrl(audio?.url ?? file.url ?? '')
}

/** 释放本地试听 blob URL，避免反复选文件后残留 */
const revoke = (file: UploadUserFile) => {
  if (!file.url?.startsWith('blob:')) return
  URL.revokeObjectURL(file.url)
  file.url = undefined
}

/** 选择后校验类型并生成本地试听地址；类型不符直接从列表移除 */
const onChange: UploadProps['onChange'] = (_file) => {
  if (!_file.raw?.type.startsWith('audio/')) {
    ElMessage.warning('只能添加音频')
    audios.value = audios.value.filter((item) => item.uid !== _file.uid)
    return
  }

  const audio = audios.value.find((item) => item.uid === _file.uid)
  if (!audio) return
  Object.assign(audio, {
    type: 'audio',
    url: audio.url ?? URL.createObjectURL(_file.raw),
  })
}

/** 本地音频移除时回收试听地址 */
watch(audios, (value, oldValue) => {
  oldValue
    .filter((old) => !value.some((file) => file.uid === old.uid))
    .forEach(revoke)
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
        <div class="meta">
          <ElIcon class="icon"><Headset /></ElIcon>
          <span v-ellipsis class="name">{{ file.name }}</span>
          <ElButton
            class="delete"
            :icon="Delete"
            circle
            size="small"
            text
            @click.stop="
              audios = audios.filter((item) => item.uid !== file.uid)
            "
          />
        </div>
        <audio :src="audioUrl(file)" controls preload="metadata" />
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
      padding: 0;
      margin: 0;
      background: transparent;
    }
  }

  .item {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
    padding: 8px;
    background: var(--el-fill-color-lighter);
    border-radius: 6px;

    > .meta {
      display: flex;
      align-items: center;
      gap: 4px;

      > .icon {
        flex: none;
        color: var(--el-text-color-secondary);
      }

      > .name {
        flex: 1;
        min-width: 0;
        color: var(--el-text-color-regular);
      }

      > .delete {
        flex: none;
      }
    }

    > audio {
      width: 100%;
      height: 32px;
    }
  }
}
</style>
