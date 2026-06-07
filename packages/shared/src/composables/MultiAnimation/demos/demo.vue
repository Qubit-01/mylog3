<script setup lang="ts">
import MultiAnimation from '..'
</script>

<template>
  <MultiAnimation class="anim">
    <div class="demo">123</div>
  </MultiAnimation>
</template>

<style lang="scss" scoped>
.demo {
  width: 100px;
  height: 100px;
  background-color: #42b983;
}

.anim {
  animation:
    anim-rotate 967ms infinite both,
    anim-translateY 1767ms infinite both,
    anim-translateX 2160ms infinite both;

  @keyframes anim-rotate {
    0% {
      transform: rotate(50deg);
    }
    100% {
      transform: rotate(0deg);
    }
  }
  @keyframes anim-translateY {
    0% {
      transform: translateY(24px);
    }
    100% {
      transform: translateY(0px);
    }
  }
  @keyframes anim-translateX {
    0% {
      transform: translateX(24px);
    }
    100% {
      transform: translateX(0px);
    }
  }
}
</style>
