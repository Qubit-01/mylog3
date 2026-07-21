<!--
LogCard：
- 展示 Log 的用户、时间、正文、媒体、音频、文件和标签。
- 点击非资源区域进入详情附属页；选择文字时不跳转。
-->
<script lang="ts" setup>
import type { Log } from '@/api'
import dayjs from 'dayjs'

const { log, hideMeta } = defineProps<{
  /** 当前展示的 Log 数据 */
  log: Log
  /** 是否隐藏用户与时间信息，默认展示 */
  hideMeta?: boolean
}>()

const router = useRouter()

/** 点击卡片外层时进入详情附属页；正在选择文字时保留文本选择 */
const onOpen = () => {
  if (window.getSelection()?.toString()) return
  router.push({ path: '/log', query: { id: log.id } })
}
</script>

<template>
  <article class="LogCard m-panel" @click="onOpen">
    <div v-if="!hideMeta" class="meta">
      <span>#{{ log.userId }}</span>
      <span>{{ dayjs(log.logAt).format('YYYY-MM-DD HH:mm') }}</span>
    </div>
    <p class="text">{{ log.text }}</p>
    <LogCardMedias :medias="log.medias" @click.stop />
    <LogCardAudios :audios="log.audios" @click.stop />
    <LogCardFiles :files="log.files" @click.stop />
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
