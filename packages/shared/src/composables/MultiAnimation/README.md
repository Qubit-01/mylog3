# MultiAnimation

通过 animation 生成多层 Div , 避免 transform 覆盖

# 解决什么问题？

动效同学给出的 CSS 动画效果常常是不同的 transform 效果，并且这些效果有各自的贝塞尔曲线。如果给 Animation 设置多个动画同时播放，transform 会被最后的动画覆盖，最终只会应用一个 transform 效果。

过去的做法是：通过嵌套 div ，给每个 div 应用不同的 animation 来实现贝塞尔各异的 transform 动画。

# 现在怎么用？

该怎么写就怎么写！不要怕 transform 会覆盖

```vue
<template>
  <MultiAnimation class="anim">
    <div>123</div>
  </MultiAnimation>
</template>

<style>
.anim {
  animation:
    anim-rotate 967ms both,
    anim-translateY 1767ms both,
    anim-translateX 2160ms both;

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
```

# 探索

## 在计算 animation 前，通过 v-show 去先让元素不渲染

否决了这个方案，因为外面可能会获取内部组件的 ref ，如果用了就可能获取的参数不准确，比如要拿子元素的高度
