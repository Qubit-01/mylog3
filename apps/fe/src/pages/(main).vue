<script lang="ts" setup>
/** 主布局：顶部导航 + 路由出口，所有 (main) 分组下的页面共用 */
</script>

<template>
  <div class="main">
    <nav class="nav">
      <RouterLink to="/">首页</RouterLink>
      <RouterLink to="/mine">我的</RouterLink>
      <RouterLink to="/map">地图</RouterLink>
      <RouterLink to="/profile">个人</RouterLink>
    </nav>
    <main class="content">
      <RouterView />
    </main>
  </div>
</template>

<style lang="scss" scoped>
.main {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  > .nav {
    display: flex;
    gap: 16px;
    padding: 12px 16px;
    border-bottom: 1px solid #eee;
  }
  > .content {
    display: flex;
    flex: 1;
    padding: 16px;
  }
}
</style>
