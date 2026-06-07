<script setup lang="ts">
import { ref } from 'vue'
import PictureImg from '@pet/quantum.PictureImg'
// import examplePic from './assets/example.jpg?preset=modern';

// 示例图片对象，项目中应该是由插件自动转换生成
const demoSrc = {
  img: {
    src: 'https://p4-plat.wsukwai.com/kcdn/cdn-kcdn112543/wishTravel/share/num0.png',
    w: 612,
    h: 152,
  },
  sources: {
    avif: 'https://p4-plat.wsukwai.com/kcdn/cdn-kcdn112543/wishTravel/share/num1.png',
    webp: 'https://p4-plat.wsukwai.com/kcdn/cdn-kcdn112543/wishTravel/share/num2.png',
  },
}

const onLoad = (text?: string) => {
  console.log('load', text)
}

const $lazyBox = ref<HTMLDivElement>()
</script>

<template>
  <div>imgAttrs 添加的属性会直接被添加到 img 标签上</div>

  <PictureImg
    :src="demoSrc"
    :imgAttrs="{ class: 'img-class' }"
    @load="onLoad('本地图')"
  />
  <hr />
  <PictureImg
    src="https://static.yximgs.com/udata/pkg/frontend-explore/pet/assets/gallery-bg1-8ef45b7e.webp"
    :retry="3"
    :imgAttrs="{ class: 'img-class' }"
    @load="onLoad('网络图')"
  />
  <hr />

  <div ref="$lazyBox" class="lazy-box">
    <div v-for="i in 70" :key="i">占位，测试observer懒加载</div>
    <!-- 下面这个会提前加载 -->
    <PictureImg
      src="https://static.yximgs.com/udata/pkg/frontend-explore/pet/assets/gallery-bg0-0e070fba.webp"
      :lazy="{
        root: $lazyBox,
        rootMargin: '0px 100px 100px 0px',
      }"
      @load="onLoad('observer懒加载')"
    />
  </div>

  <div v-for="i in 70" :key="i">占位，测试原生懒加载</div>
  <PictureImg
    src="https://static.yximgs.com/udata/pkg/frontend-explore/pet/assets/gallery-bg2-a8277af1.webp"
    lazy
    @load="onLoad('原生懒加载')"
  />
</template>

<style scoped lang="scss">
.PictureImg {
  // width: 200px;
  height: 100px;
  border: 2px solid red;
}

.lazy-box {
  width: 100%;
  height: 500px;
  overflow: auto;
  border: 2px solid blue;
}
</style>
