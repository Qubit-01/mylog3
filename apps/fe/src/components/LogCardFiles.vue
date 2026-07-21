<!--
LogCardFiles：
- 展示 Log 关联的普通文件名称，支持在新标签页打开或按原始文件名下载。
- 仅负责只读访问，不包含上传、删除等编辑能力。
-->
<script lang="ts" setup>
import type { LogFile } from '@/api'
import { downloadResource } from '@/composables/cos'
import { toResourceUrl } from 'shared/cos'
import { vEllipsis } from 'shared/ellipsis'
import { Document, Download } from '@element-plus/icons-vue'

const { files } = defineProps<{
  /** 当前 Log 的普通文件列表 */
  files: LogFile[]
}>()
</script>

<template>
  <div v-if="files.length" class="LogCardFiles">
    <div v-for="file in files" :key="file.url" class="item">
      <a
        class="file"
        :href="toResourceUrl(file.url)"
        target="_blank"
        rel="noopener"
      >
        <ElIcon class="icon"><Document /></ElIcon>
        <span v-ellipsis class="name">{{ file.name }}</span>
      </a>
      <ElButton
        :icon="Download"
        circle
        text
        size="small"
        type="info"
        title="下载"
        @click="downloadResource(file)"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.LogCardFiles {
  display: flex;
  flex-direction: column;
  gap: 4px;

  > .item {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
    padding: 8px;
    background: var(--el-fill-color-lighter);
    border-radius: 6px;

    > .file {
      display: flex;
      flex: 1;
      align-items: center;
      gap: 4px;
      min-width: 0;

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
  }
}
</style>
