<script lang="ts" setup>
import { ref } from 'vue'
import { menuData } from './data'
import { vMultiMenu, type MultiMenuData } from '..'

const menu = ref<MultiMenuData[]>(menuData)

const pushItem = () => {
  setTimeout(() => {
    menu.value.push({
      type: 'item',
      text: '新菜单项',
    })
  }, 2000)
}
</script>

<template>
  <div class="demo">
    <button @click="pushItem">2秒后添加菜单项</button>
    <div v-multi-menu:rb="menu" class="item rb">rb</div>
    <div style="position: absolute; top: 100px">建议在新窗口打开<br /></div>
  </div>
</template>

<style lang="scss" scoped>
.demo {
  > .item {
    position: fixed;
    background-color: #0003;
    width: 100px;
    height: 30px;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 16px;
    border-radius: 10px;

    &.rb {
      top: 30px;
      left: 30px;
    }
  }
}
</style>

<pet-info lang="json">
{
  "title": "Vue指令调用",
  "description": "场景：只能hover，且定位方式固定",
  "priority": 9
}
</pet-info>
