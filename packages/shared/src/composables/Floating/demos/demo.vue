<script lang="ts" setup>
import { ref } from 'vue'
import Floating, { ToolTip } from '..'

const show = ref(false)
</script>

<template>
  <div class="demo">
    <div
      class="menu-btn"
      @pointerenter="show = true"
      @pointerleave="show = false"
    >
      按钮
    </div>
    <Floating v-model:show="show">ToolTip</Floating>

    <div class="menu-btn">按钮</div>
    <ToolTip>ToolTip</ToolTip>
  </div>
</template>

<style lang="scss" scoped>
.demo {
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;

  .menu-btn {
    background-color: #0002;
    width: 70px;
    height: 40px;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 16px;
    border-radius: 10px;

    margin-right: 50px;
  }

  .Floating {
    background-color: #f005;
    width: 100px;
    height: 40px;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 16px;
    border-radius: 10px;
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
  "title": "基本使用，一看就会",
  "description": "Pet 一直不更新Vue3.4以上，所以不支持defineModel，导致demo展示不了，先看看代码吧",
  "priority": 9
}
</pet-info>
