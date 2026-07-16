<script lang="ts" setup>
import { useAMap } from '@/composables/map'

/** 地图 */
definePage({ meta: { auth: true, title: '地图' } })

const $aMap = useTemplateRef('$aMap')
const { map, error } = useAMap($aMap)
</script>

<template>
  <div class="map">
    <div ref="$aMap" class="aMap swiper-no-swiping" />
    <div v-if="!map || error" class="status">
      <span>{{ error || '地图加载中…' }}</span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.map {
  position: relative;
  height: 100%;

  > .aMap {
    height: 100%;
  }

  > .status {
    position: absolute;
    inset: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 24px;
    color: var(--el-text-color-secondary);
    background: var(--el-bg-color);
  }
}
</style>
