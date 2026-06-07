<script setup lang="ts">
import AspectDiv from '..'
</script>

<template>
  <div class="demo">
    <AspectDiv :ratio="[9, 16]">我要等比缩放！</AspectDiv>
  </div>
</template>

<style lang="scss" scoped>
.aspect-div {
  width: 100px;
  background: yellow;

  animation: identifier 2s linear infinite;

  @keyframes identifier {
    0% {
      width: 100px;
    }
    50% {
      width: 300px;
    }
    100% {
      width: 100px;
    }
  }
}
</style>
