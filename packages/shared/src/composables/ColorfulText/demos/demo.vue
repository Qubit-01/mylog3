<script lang="ts" setup>
import ColorfulText from '@pet/quantum.ColorfulText'
</script>

<template>
  <div class="demo">
    基本使用
    <div>
      <ColorfulText>渐变色</ColorfulText>
    </div>
    自定义渐变色
    <div>
      <ColorfulText class="demo1">渐变色</ColorfulText>
    </div>
    自定义裁剪量，可能会导致切边
    <div>
      <ColorfulText class="demo2">渐变色</ColorfulText>
    </div>
    背景也可以是图片
    <div>
      <ColorfulText class="demo3">渐变色</ColorfulText>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.demo {
  .colorful-text {
    font-size: 40px;
  }

  .demo1 {
    background-image: linear-gradient(346.11deg, yellow 6.59%, green 87.44%);
  }

  .demo2 {
    --quantum-ColorfulText-inset-x: 15px;
    --quantum-ColorfulText-inset-y: 15px;
  }

  .demo3 {
    background-image: url(./bug.png);
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
