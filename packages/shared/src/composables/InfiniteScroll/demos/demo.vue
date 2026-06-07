<script lang="ts" setup>
import vInfiniteScroll from '..'
import { ref } from 'vue'

const count = ref(0)
const load = () => {
  count.value += 2
}
</script>

<template>
  <div class="demo">
    <ul v-infinite-scroll="load" style="overflow: auto; height: 100px">
      <li v-for="i in count" :key="i">{{ i }}</li>
    </ul>
  </div>
</template>

<style lang="scss" scoped></style>
