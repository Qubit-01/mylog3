<script lang="ts" setup>
import { defineProps } from 'vue'

defineProps<{
  animations: string[]
}>()
</script>

<template>
  <div v-if="animations.length" :style="{ animation: animations[0] }">
    <AnimationItem :animations="animations.slice(1)">
      <slot />
    </AnimationItem>
  </div>
  <slot v-else />
</template>

<style lang="scss" scoped></style>
