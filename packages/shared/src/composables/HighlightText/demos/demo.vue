<script setup lang="ts">
import HighlightText from '../index.vue'

const text = '哈哈哈${高光}哈哈哈${高光中的${高光}试试}哈哈哈${惰性}匹配}哈哈哈'
</script>

<template>
  <div class="demo">
    <h1>最简洁的使用方式</h1>
    <HighlightText :text="text" />
    <h1>添加自定义class</h1>
    <HighlightText :text="text" class="add-border" />
    <h1>属性透传 使你可以直接添加高亮样式</h1>
    <HighlightText :text="text" :style="{ background: 'green' }" />
    <h1>样式被污染了，可以去除默认带的highlight类</h1>
    <HighlightText
      :text="text"
      no-default-class
      :style="{ background: 'green' }"
    />
  </div>
</template>

<style lang="scss" scoped>
.demo {
  // 切记加:deep()
  :deep(.highlight) {
    color: red;
  }

  :deep(.add-border) {
    border: 1px solid red;
  }
}
</style>

<pet-info lang="json">
{
  "title": "你就学吧",
  "description": "一学就会",
  "priority": 9
}
</pet-info>
