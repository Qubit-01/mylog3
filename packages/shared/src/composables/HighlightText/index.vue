<script setup lang="ts">
import { computed } from 'vue'
import { getHighlights } from './utils'

const props = defineProps<{
  /** 含有 ${} 的字符串，如：最高${88元} */
  text: string
  /** 不需要默认的 highlight 类，如果样式被污染了可以去除默认class */
  noDefaultClass?: boolean
}>()

const highlightTexts = computed(() => getHighlights(props.text))
</script>
<template>
  <div class="HighlightText">
    <template v-for="(t, i) in highlightTexts" :key="i">
      <span
        v-if="t.highlight"
        :class="{ highlight: !noDefaultClass }"
        v-bind="$attrs"
        >{{ t.text }}</span
      >
      <template v-else>{{ t.text }}</template>
    </template>
  </div>
</template>
