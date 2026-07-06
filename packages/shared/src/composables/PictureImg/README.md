# PictureImg 多格式图片组件

配合 `vite-imagetools` 输出 `<picture>` 需要的多格式、多尺寸图片，并兼容网络图片的懒加载、错误重试。

> 为什么不直接命名叫 Picture？因为 `picture` 是 HTML 标签名，Vue 组件名避开它可以减少类型解析和自动补全的歧义。

---

## 配置 imagetools

### 安装配置插件

1. 必须配合 [vite-imagetools](https://github.com/JonasKruckenberg/imagetools) 使用

   `pnpm add -D vite-imagetools`

2. 配置插件：修改 `vite.config.ts`

使用官方 `as=picture` 作为入口，只给它补默认 `w` 和 `format`。用户在 import 里显式传入的 `w` / `format` 会覆盖这里的默认值。

```ts
import { imagetools } from 'vite-imagetools'

export default defineConfig({
  plugins: [
    // ...
    imagetools({
      defaultDirectives: (url) => {
        if (url.searchParams.get('as') === 'picture') {
          return new URLSearchParams({
            w: '640;1280;1920',
            format: `avif;webp;${url.pathname.split('.').pop()}`,
          })
        }
        return new URLSearchParams()
      },
    }),
  ],
})
```

3. 根据上面的配置添加全局类型： `vite-env.d.ts`

这一步是避免 TS 把 `?as=picture` 当成普通图片 URL。

```ts
type Picture = import('vite-imagetools').Picture

declare module '*as=picture' {
  const src: Picture
  export default src
}

```

---

## 如何使用 PictureImg

### 1. 本地图片这样用

```html
<script setup lang="ts">
  import PictureImg from 'shared/PictureImg'
  import examplePic from './components/example.jpg?as=picture'
</script>

<template>
  <PictureImg :src="examplePic" lazy />
</template>
```

默认会生成三档宽度和三种格式：

```txt
w=640;1280;1920
format=avif;webp;原格式
as=picture
```

如果当前图片本身小于某个宽度档位，`vite-imagetools` 默认不会放大，会自动把超过原图宽度的档位夹到原图宽度并去重。

项目约定：`as=picture` 固定写在 query 最后一个参数。  
如果某张图需要单独控制尺寸或格式，直接在后面追加官方参数覆盖默认值：

```ts
import bannerPic from './banner.jpg?w=768;1440;1920&as=picture'
import jpgOnlyPic from './cover.jpg?format=webp;jpg&as=picture'
```

PictureImg 的 `src` 接收一个对象，如：

```js
{ // vite-imagetools 生成的图片对象
  img: {src: '/@imagetools/19b8f0e7a78', w: 5304, h: 7952}
  sources: {avif: '/@imagetools/6165531 5304w', webp: '/@imagetools/58dbfda 5304w'}
}
```

### 2. 网络图片这样用

```html
<script setup lang="ts">
  import PictureImg from 'shared/PictureImg'
</script>

<template>
  <!-- 最简用法，无懒加载，无重试 -->
  <PictureImg src="https://example.com/1.png" />

  <!-- 
     懒加载用法1：lazy 传入 boolean 值 (推荐用属性简写形式，更优雅)，用的 img.loading 原生懒加载
     若不支持原生懒加载，则自动切换使用 IntersectionObserver (见下一种用法)
     详情见：https://developer.mozilla.org/zh-CN/docs/Web/API/HTMLImageElement/loading
    -->
  <PictureImg src="https://example.com/1.png" lazy />

  <!-- 
     懒加载用法2：传入对象，对象的值就是 IntersectionObserver 的第二个参数
     使用的 IntersectionObserver，可以进行更精细化的控制，如 { rootMargin: '-50px 0px -50px 0px' }
     详情见 https://developer.mozilla.org/zh-CN/docs/Web/API/IntersectionObserver/IntersectionObserver
    -->
  <PictureImg
    src="https://example.com/1.png"
    :lazy="{ rootMargin: '-50px 0px -50px 0px' }"
  />

  <!-- 加载出错重试，传入错误重试次数，默认不重试，每次重试间隔 1s -->
  <PictureImg src="https://example.com/1.png" :retry="3" />
</template>
```

---

## 探索&注意

### 建议添加 eslint 规则

```js
'vue/no-restricted-html-elements': [
    'warn',
    {
        element: 'img',
        message: '尽量使用性能更好的 shared/PictureImg 组件哦',
    },
],
```

### 透传属性到img，解决样式问题

组件内部是 `<picture> <img /> </picture>`  
在 h5 中，img 是一个 inline 元素，所以元素会出现小间隙问题 https://blog.csdn.net/Garbrielle/article/details/134469593 （随便找的文章）  
在 PictureImg 中，picture 和 img 都直接设置为了 flex 元素（出于使用者方便考虑，应该没人会用到 inline 的特性吧）  
如果你要改 img 的属性，也提供了 `imgAttrs` API，传参可直接透传属性到 img 标签上

### 网络图片为啥不直接用img标签？

说得对，在没有懒加载、错误重试等需求时，用 img 标签确实是更好的选择，既没有bug，也没有心智负担。

### iOS设备bug

在 ios 设备中，会同时加载最佳兼容图片和兜底图，也就是会同时加载 `<picture>` 标签中，source 链接和兜底的 img 图片链接。  
25CNY 时幸好有离线包，才没把 CDN 打爆。  
这个bug的解法是：在 img dom 挂载后，再给 src 赋值。在本组件中，src 属性都是在 dom 挂载后才赋值（baseAttrs），所有也就规避了这个bug。

### 对应的行为

开发环境（`vite dev`) 初次请求图片资源时需要进行格式转换，图片的加载时间比较长。  
生产环境（`vite build`) 会把需要的图片格式都构建出来。

---

## 依赖

vue >= 3.5

## 参考文献

https://developer.mozilla.org/zh-CN/docs/Web/HTML/Reference/Elements/picture

https://github.com/JonasKruckenberg/imagetools
