# Floating 相对浮起元素

默认相对于同级前一个兄弟元素定位，通过show控制弹窗的显示。

## ToolTip

基于 Floating 组件，并封装了 hover 逻辑的二级组件

## 弹窗的探索

起初是自己实现定位，但是发现，很多地方需要考虑，比如

- 监听窗口 resize，动态计算位置
- 监听所有祖先元素 scroll，动态计算位置
- MutationObserver，监听相对元素、浮起元素dom结构变化
- ResizeOvserver，监测目标元素和弹窗的尺寸变化
- 防抖，不能频繁执行计算。优化流畅性。

目前有成熟的解决方案 floating-ui

## floating-ui

https://floating-ui.com/

```scss
// 默认采用绝对定位 + transform
.el {
  position: absolute;
  left: 0px;
  top: 0px;
  transform: translate(1384.5px, 717px);
  will-change: transform;
}

// 禁用后 transform: false
.el {
  position: absolute;
  left: 1384.5px;
  top: 717px;
}
```

## 依赖

- @floating-ui/vue 动态计算元素定位的成熟方案
- Vue 3.5+
