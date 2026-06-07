<script lang="ts" setup>
defineProps<{}>()
</script>

<template>
  <span class="ColorfulText">
    <slot />
  </span>
</template>

<style lang="scss" scoped>
:global(:root) {
  /* 横向裁剪量 */
  --quantum-ColorfulText-inset-x: 0.7px;
  /* 纵向裁剪量 */
  --quantum-ColorfulText-inset-y: 0.7px;
}

.ColorfulText {
  background-clip: text;
  color: transparent;

  background-image: linear-gradient(346.11deg, red 6.59%, blue 87.44%);
  background-repeat: no-repeat;
  background-position: var(--quantum-ColorfulText-inset-x)
    var(--quantum-ColorfulText-inset-y);
  background-size: calc(100% - 2 * var(--quantum-ColorfulText-inset-x))
    calc(100% - 2 * var(--quantum-ColorfulText-inset-y));
}
</style>
