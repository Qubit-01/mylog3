<!--
Test：
- 使用最简 ElUpload picture-card 多选验证系统相册返回的文件顺序。
- 不包含业务处理、排序或实际上传，避免其他逻辑影响验证结果。
-->
<script lang="ts" setup>
import { Plus } from '@element-plus/icons-vue'
</script>

<template>
  <div class="Test">
    <ElUpload
      list-type="picture-card"
      accept="image/*,video/*"
      multiple
      :auto-upload="false"
    >
      <ElIcon><Plus /></ElIcon>
    </ElUpload>
  </div>
</template>
