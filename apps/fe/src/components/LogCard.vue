<script lang="ts" setup>
/** Log 卡片：最基础的展示形式，显示时间、正文、标签 */
import type { Log } from '@/api'
import dayjs from 'dayjs'

const { log } = defineProps<{
  /** 当前展示的 Log 数据 */
  log: Log
}>()

const router = useRouter()

/** 点击卡片外层时在新标签页打开详情；正在选择文字时保留文本选择 */
const onOpen = () => {
  if (window.getSelection()?.toString()) return
  window.open(
    router.resolve({ path: '/log', query: { id: log.id } }).href,
    '_blank',
    'noopener',
  )
}
</script>

<template>
  <article class="LogCard m-panel" @click="onOpen">
    <div class="meta">
      <span>#{{ log.userId }}</span>
      <span>{{ dayjs(log.logAt).format('YYYY-MM-DD HH:mm') }}</span>
    </div>
    <p class="text">{{ log.text }}</p>
    <LogCardMedias :medias="log.medias" @click.stop />
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
  padding: 12px;

  > .meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
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
