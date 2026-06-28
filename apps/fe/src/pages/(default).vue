<script lang="ts" setup>
/** 主布局：内容区 + 底部 TabBar */
</script>

<template>
  <div class="main">
    <main class="content">
      <RouterView />
    </main>
    <TabBar />
  </div>
</template>

<style lang="scss" scoped>
.main {
  display: flex;
  flex-direction: column;
  height: 100dvh;

  > .content {
    flex: 1;
    overflow-y: auto;
  }
}
</style>
