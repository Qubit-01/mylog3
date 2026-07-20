<!--
LogCardAudios：
- 展示 Log 关联的音频名称与原生播放器。
- 仅负责只读播放，不包含上传、删除等编辑能力。
-->
<script lang="ts" setup>
import type { LogAudio } from '@/api'
import { toResourceUrl } from 'shared/cos'
import { vEllipsis } from 'shared/ellipsis'
import { Headset } from '@element-plus/icons-vue'

const { audios } = defineProps<{
  /** 当前 Log 的音频列表 */
  audios: LogAudio[]
}>()
</script>

<template>
  <div v-if="audios.length" class="LogCardAudios">
    <div v-for="audio in audios" :key="audio.url" class="item">
      <div class="meta">
        <ElIcon class="icon"><Headset /></ElIcon>
        <span v-ellipsis class="name">{{ audio.name }}</span>
      </div>
      <audio :src="toResourceUrl(audio.url)" controls preload="metadata" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.LogCardAudios {
  display: flex;
  flex-direction: column;
  gap: 4px;

  > .item {
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
    }

    > audio {
      width: 100%;
      height: 32px;
    }
  }
}
</style>
