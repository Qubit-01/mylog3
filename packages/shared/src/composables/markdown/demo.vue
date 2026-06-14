<script lang="ts" setup>
import MarkdownViewer from './MarkdownViewer.vue'

const content = ref(`# MarkdownViewer

## 主要功能
- 切换渲染后 / 原文，支持列表、引用和代码块
- **复制**当前模式内容

## 使用示例
\`\`\`ts
const message = 'hello markdown'
\`\`\`
`)
</script>

<template>
  <div class="demo">
    <MarkdownViewer :content="content" />
  </div>
</template>

<style lang="scss" scoped>
.demo {
  padding: 16px;
}
</style>
