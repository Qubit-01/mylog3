<script lang="ts" setup>
import { ref } from 'vue'
import { menuData } from './data'
import { initMultiMenu, type MultiMenuData, type PositionType } from '..'

const menu = ref<MultiMenuData[]>(menuData)

const pushItem = () => {
  setTimeout(() => {
    menu.value.push({
      type: 'item',
      text: '新菜单项',
    })
  }, 2000)
}

const showMenu = (e: Event, position: PositionType) => {
  initMultiMenu(e.target as HTMLElement, {
    menu: menu.value,
    position,
  })
}
</script>

<template>
  <div class="demo">
    <button @click="pushItem">2秒后添加菜单项</button>
    <div class="item lt" @pointerenter="showMenu($event, 'lt')">lt</div>
    <div class="item lb" @pointerenter="showMenu($event, 'lb')">lb</div>
    <div class="item rt" @pointerenter="showMenu($event, 'rt')">rt</div>
    <div class="item rb" @pointerenter="showMenu($event, 'rb')">rb</div>
    <div class="item tl" @pointerenter="showMenu($event, 'tl')">tl</div>
    <div class="item tr" @pointerenter="showMenu($event, 'tr')">tr</div>
    <div class="item bl" @pointerenter="showMenu($event, 'bl')">bl</div>
    <div class="item br" @pointerenter="showMenu($event, 'br')">br</div>
    <div style="position: absolute; top: 100px">
      建议在新窗口打开<br />
      单例写法: 组件的所有属性都支持响应式，你可以在任何地方修改，然后就会生效
    </div>
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

    &.lt {
      bottom: 30px;
      right: 30px;
    }
    &.lb {
      top: 30px;
      right: 30px;
    }
    &.rt {
      bottom: 30px;
      left: 30px;
    }
    &.rb {
      top: 30px;
      left: 30px;
    }
    &.tl {
      bottom: 70px;
      right: 30px;
    }
    &.tr {
      bottom: 70px;
      left: 30px;
    }
    &.bl {
      top: 70px;
      right: 30px;
    }
    &.br {
      top: 70px;
      left: 30px;
    }
  }
}
</style>

<pet-info lang="json">
{
  "title": "命令式调用",
  "description": "场景：只能hover，且定位方式固定",
  "priority": 9
}
</pet-info>
