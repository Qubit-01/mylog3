<script lang="ts" setup>
import { DocumentCopy } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

import { markdownIt, copyRichText4Markdown } from './utils'

import 'github-markdown-css/github-markdown-light.css' // Markdown 渲染样式

type Mode = 'HTML' | 'RAW'

const props = defineProps<{
  /** 要展示的 markdown 原文 */
  content: string
}>()

const html = computed(() => markdownIt.render(props.content))

const mode = ref<Mode>('HTML')
const modeOptions: Mode[] = ['HTML', 'RAW']

const { copy } = useClipboardItems()

const copyContent = async () => {
  const isHTMLMode = mode.value === 'HTML'
  try {
    if (isHTMLMode) {
      await copyRichText4Markdown(props.content)
      ElMessage.success('已复制富文本')
    } else {
      await copy([
        new ClipboardItem({
          'text/plain': new Blob([props.content], { type: 'text/plain' }),
        }),
      ])
      ElMessage.success('已复制原文')
    }
  } catch (error) {
    console.error('复制失败', error)
    ElMessage.error('复制失败，请检查浏览器权限')
  }
}
</script>

<template>
  <div class="MarkdownViewer">
    <div v-if="mode === 'HTML'" class="panel markdown-body" v-html="html" />
    <pre v-else class="panel source"><code>{{ content }}</code></pre>

    <div class="toolbar">
      <ElButton :icon="DocumentCopy" size="small" circle @click="copyContent" />
      <ElSegmented v-model="mode" :options="modeOptions" size="small" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.MarkdownViewer {
  position: relative;
  display: flex;
  width: 100%;
  height: 240px;
  padding: 8px;
  border: 1px dashed #ccc;
  border-radius: 8px;

  font-size: 14px;

  > .panel {
    flex: 1;
    overflow: auto;

    &.markdown-body {
      background-color: transparent;
    }

    &.source {
      white-space: pre-wrap;
      word-break: break-word;
    }
  }

  > .toolbar {
    position: absolute;
    top: 12px;
    right: 12px;
    display: flex;
    align-items: center;
    gap: 8px;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.2s ease;
  }

  &:hover > .toolbar {
    opacity: 1;
    pointer-events: auto;
  }
}
</style>
