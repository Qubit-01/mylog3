<script setup lang="ts">
import { ref } from 'vue'
import CustomeButton from '../index.vue'
const num = ref(0)
</script>

<template>
  <div class="demo">
    <h1>{{ num }}</h1>

    <h1>基本使用</h1>
    <CustomeButton @click="num++">普通按钮</CustomeButton>

    <h1>禁用状态</h1>
    <CustomeButton disable @click="num++" @disabled-click="num--"
      >禁用按钮</CustomeButton
    >

    <h1>基本使用</h1>
    <CustomeButton @click="num++" breath>普通按钮</CustomeButton>

    <h1>自定义尺寸、背景、按下时的背景、按下时的动效</h1>
    <CustomeButton class="demo2" @click="num++" no-default-active>
      <!-- 通过插槽传参，可以获取到组件按下状态 -->
      <template v-slot="{ active }">{{
        active ? '按下状态' : '正常状态'
      }}</template>
      <template #lower="{ active }">
        <img src="./assets/btn_bg.png" alt="" />
        <img
          src="./assets/btn_down.png"
          class="img_down"
          :class="{ active }"
          alt=""
        />
      </template>
    </CustomeButton>
  </div>
</template>

<style lang="scss" scoped>
.demo {
  .demo2 {
    width: 108px;
    height: 108px;
    transition: transform 0.3s;

    img {
      width: 140px;
      height: 140px;
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);

      &.img_down {
        width: 176px;
        height: 176px;
        opacity: 0;
        transition: opacity 0.3s;
        &.active {
          opacity: 1;
        }
      }
    }

    // 组件里面自动加的class，用于使用者自定义样式
    &.active {
      transform: scale(0.85);
    }
  }
}
</style>

<pet-info lang="json">
{
  "title": "基本使用",
  "description": "基操勿6，一看就会用了",
  "priority": 9
}
</pet-info>
