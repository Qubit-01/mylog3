<script lang="ts" setup>
/** Log 卡片：最基础的展示形式，显示时间、正文、标签 */
import type { Log } from '@/api'
import dayjs from 'dayjs'

const props = defineProps<{ log: Log }>()

provide('userId', props.log.userId)
</script>

<template>
  <article class="LogCard">
    <div class="meta">
      <span>#{{ log.userId }}</span>
      <span>{{ dayjs(log.logAt).format('YYYY-MM-DD HH:mm') }}</span>
    </div>
    <p class="text">{{ log.text }}</p>
    <LogCardMedias :medias="log.medias" />
    <div v-if="log.tags.length" class="tags">
      <span v-for="t in log.tags" :key="t">#{{ t }}</span>
    </div>
  </article>
</template>

<style lang="scss" scoped>
.LogCard {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 16px;
  background: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);

  > .meta {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  > .text {
    white-space: pre-wrap;
    word-break: break-word;
  }

  > .tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    font-size: 12px;
    color: var(--el-color-primary);
  }
}
</style>
