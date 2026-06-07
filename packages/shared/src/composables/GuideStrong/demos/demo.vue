<script setup lang="ts">
import { ref } from 'vue'
import GuideStrong from '../index.vue'

/** 控制步数 */
const step = ref(-1)
/** 由返回蒙层参数的函数组成的列表 */
const attrList = [
  () => ({
    width: '0px',
    height: '0px',
    left: '200px',
    top: '50px',
  }),
  () => ({
    width: '100px',
    height: '200px',
    left: '150px',
    top: '100px',
  }),
  // 动态获取元素的位置宽高
  () => {
    const rect = document.querySelector(`.demo>.start`)?.getBoundingClientRect()
    return {
      width: (rect?.width ?? 0) + 16 + 'px',
      height: (rect?.height ?? 0) + 16 + 'px',
      left: (rect?.left ?? 0) - 8 + 'px',
      top: (rect?.top ?? 0) - 8 + 'px',
    }
  },
  // 动态获取元素的位置宽高
  () => {
    const rect = document.querySelector(`.demo>.box1`)?.getBoundingClientRect()
    return {
      width: (rect?.width ?? 0) + 16 + 'px',
      height: (rect?.height ?? 0) + 16 + 'px',
      left: (rect?.left ?? 0) - 8 + 'px',
      top: (rect?.top ?? 0) - 8 + 'px',
    }
  },
  // 要先滚动在引导，这里用await模拟滚动延时
  () => {
    const rect = document.querySelector(`.demo>.box2`)?.getBoundingClientRect()
    return {
      width: (rect?.width ?? 0) + 16 + 'px',
      height: (rect?.height ?? 0) + 16 + 'px',
      left: (rect?.left ?? 0) - 8 + 'px',
      top: (rect?.top ?? 0) - 8 + 'px',
    }
  },
]

const prev = () => {
  step.value--
}

const next = () => {
  // 切第四步前，滚动到box2
  if (step.value === 3) {
    document.querySelector(`.demo>.box2`)?.scrollIntoView(false)
    window.scrollBy(0, 40)
  }
  step.value++
}

const start = () => {
  step.value = 0
}
const end = () => {
  step.value = -1
}
</script>

<template>
  <div class="demo">
    <h1 v-for="i of 5">强引导强引导</h1>
    <button :height="38" class="start" @click.stop="start">开始</button>
    <h1 v-for="i of 5">强引导强引导</h1>
    <div class="box1">介绍我</div>
    <h1 v-for="i of 15">强引导强引导</h1>
    <div class="box2">再滚下来介绍我</div>
    <h1 v-for="i of 5">强引导强引导</h1>

    <Transition>
      <GuideStrong
        v-if="step > -1 && step < attrList.length"
        :attrList="attrList"
        :step="step"
        @click-inner="prev"
        @click-mask="next"
      >
        <div>框里面的东西</div>
        <template #on-mask>
          <div class="btns">
            <button :height="38" @click.stop="prev">上一步</button>
            <button :height="38" @click.stop="next">下一步</button>
            <button :height="38" @click.stop="end">退出</button>
          </div>
          <div class="text">
            当前步数：{{ step }} 当前参数：{{ attrList[step]?.() }}
          </div>
        </template>
      </GuideStrong>
    </Transition>
  </div>
</template>

<style lang="scss" scoped>
.demo {
  font-size: 10px;

  .box1 {
    width: 150px;
    height: 100px;
    margin-left: 50px;
    background-color: blue;
  }
  .box2 {
    width: 150px;
    height: 100px;
    margin-left: 150px;
    background-color: green;
  }

  button {
    width: 60px;
    height: 30px;
  }

  .guide-strong {
    --steps: 10; // 控制帧数
    color: red;

    .text {
      position: absolute;
      top: 10px;
    }

    .btns {
      position: absolute;
      top: 40px;
      display: flex;
      justify-content: space-between;
    }
  }
}

// 蒙层淡出
.v-leave-active {
  transition: opacity 333ms;
  opacity: 0;
}

:global(body) {
  margin: 0;
}
</style>

<pet-info lang="json">
{
  "title": "基本使用",
  "description": "手动在不同的事件上绑定控制 step 的方法，使 attrList[step]() 返回正确的蒙层参数。可在修改 step 值的前后加其他逻辑，比如滚动",
  "priority": 9
}
</pet-info>
