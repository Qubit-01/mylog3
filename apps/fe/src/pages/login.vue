<script lang="ts" setup>
/** 登录页：独立全屏布局，不走主导航 */
import { ref } from 'vue'

const username = ref('')
const password = ref('')
</script>

<template>
  <div class="login">
    <div class="card">
      <h1>登录</h1>
      <el-input v-model="username" placeholder="用户名" />
      <el-input v-model="password" type="password" placeholder="密码" show-password />
      <el-button type="primary">登录</el-button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.login {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  > .card {
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: 320px;
    padding: 24px;
    border: 1px solid #eee;
    border-radius: 8px;
  }
}
</style>
