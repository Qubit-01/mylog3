<script lang="ts" setup>
import { ref } from 'vue'
import { menuData } from './data'
import MultiMenu from '../index.vue'
import type { MultiMenuData } from '..'

const menuProps = ref<{
  show: boolean
  position: 'lt' | 'lb' | 'rt' | 'rb' | 'tl' | 'tr' | 'bl' | 'br'
  relativeEl: string | HTMLElement
}>({
  show: false,
  position: 'lt',
  relativeEl: '',
})

const menu = ref<MultiMenuData[]>(menuData)

const pushItem = () => {
  setTimeout(() => {
    menu.value.push({
      type: 'item',
      text: '新菜单项',
    })
  }, 2000)
}

const enter = (
  event: Event,
  position: 'lt' | 'lb' | 'rt' | 'rb' | 'tl' | 'tr' | 'bl' | 'br',
) => {
  menuProps.value = {
    show: true,
    position,
    relativeEl: event.target as HTMLElement,
  }
}

const leave = () => {
  menuProps.value.show = false
}
</script>

<template>
  <div class="demo">
    <button @click="pushItem">2秒后添加菜单项</button>
    <div
      class="item lt"
      @pointerenter="enter($event, 'lt')"
      @pointerleave="leave"
    >
      lt
    </div>
    <div
      class="item lb"
      @pointerenter="enter($event, 'lb')"
      @pointerleave="leave"
    >
      lb
    </div>
    <div
      class="item rt"
      @pointerenter="enter($event, 'rt')"
      @pointerleave="leave"
    >
      rt
    </div>
    <div
      class="item rb"
      @pointerenter="enter($event, 'rb')"
      @pointerleave="leave"
    >
      rb
    </div>
    <div
      class="item tl"
      @pointerenter="enter($event, 'tl')"
      @pointerleave="leave"
    >
      tl
    </div>
    <div
      class="item tr"
      @pointerenter="enter($event, 'tr')"
      @pointerleave="leave"
    >
      tr
    </div>
    <div
      class="item bl"
      @pointerenter="enter($event, 'bl')"
      @pointerleave="leave"
    >
      bl
    </div>
    <div
      class="item br"
      @pointerenter="enter($event, 'br')"
      @pointerleave="leave"
    >
      br
    </div>
    <MultiMenu
      :menu="menu"
      :show="menuProps.show"
      :position="menuProps.position"
      :relative-el="menuProps.relativeEl"
    />
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
  "title": "单例式使用",
  "description": "MultiMenu 组件支持单例式使用，所有属性都支持响应式，你可以在任何地方修改，实时生效",
  "priority": 9
}
</pet-info>
