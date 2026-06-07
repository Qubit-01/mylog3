<script lang="ts" setup>
import { ref } from 'vue'
import { menuData } from './data'
import MultiMenu from '../index.vue'
import type { MultiMenuData } from '..'

const show = ref(false)
const menu = ref<MultiMenuData[]>(menuData)
</script>

<template>
  <div class="demo">
    <div
      class="menu-btn"
      @pointerenter="show = true"
      @pointerleave="show = false"
    >
      菜单
    </div>
    <MultiMenu :menu="menu" :show="show" />

    <div class="tip">
      建议在新窗口打开<br />
      可以通过传入relativeEl来指定相对元素<br />
      {{ show }}
    </div>
  </div>
</template>
<style lang="scss" scoped>
.demo {
  width: 100vw;
  height: 100vh;
  display: flex;
  // justify-content: center;
  // align-items: center;

  .menu-btn {
    background-color: #0002;
    width: 70px;
    height: 40px;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 16px;
    border-radius: 10px;
    margin-left: 100px;
    margin-top: 100px;
  }

  .tip {
    position: fixed;
    top: 0;
    left: 0;
  }
}

:global(body) {
  margin: 0;
}
</style>

<pet-info lang="json">
{
  "title": "基本使用",
  "description": "基操勿🤙，可以无限递归",
  "priority": 9
}
</pet-info>
