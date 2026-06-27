<script lang="ts" setup>
/** 基础布局：顶部 header + 主内容区，最简版本 */
</script>

<template>
  <div class="DefaultLayout">
    <header class="header">多元记</header>
    <main class="main">
      <RouterView />
    </main>
  </div>
</template>

<style lang="scss" scoped>
.DefaultLayout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;

  > .header {
    display: flex;
    align-items: center;
    padding: 0 16px;
    height: 48px;
    border-bottom: 1px solid #eee;
  }

  > .main {
    display: flex;
    flex: 1;
    padding: 16px;
  }
}
</style>
