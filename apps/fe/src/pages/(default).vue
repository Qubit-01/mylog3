<script lang="ts" setup>
/** 默认布局：内容区 + 底部 TabBar */
</script>

<template>
  <div class="default">
    <main class="main">
      <RouterView />
    </main>
    <TabBar />
  </div>
</template>

<style lang="scss" scoped>
.default {
  display: flex;
  flex-direction: column;
  height: 100dvh;

  > .main {
    flex: 1;
    overflow-y: auto;
  }
}
</style>
