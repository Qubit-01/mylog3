# MultiMenu 无限级下拉菜单

通过递归调用组件自身实现配置式下拉菜单

- 高度不够可滚动
- 位置自适应计算
  - 垂直方向上，当子菜单超出底部时，会自动上移
  - 水平方向上，当剩余空间不足以显示时，会在另一边显示
- 无限递归调用

## 注意点

- 千万避免传入的 data.children 循环调用！！！
- 保证页面的最小宽度至少能容纳2个菜单宽度，否则会出现滚动条
- ~~调用时，组件的父元素必须设置非static，因为菜单是absolute定位的~~

### 菜单的定位方式

传入一个dom，相对于这个dom定位，如果没有传，就相对于第一个父元素，搭配postion相对定位

### 采用最大高度策略

每个菜单都设置了一个最大高度，当超出最大高度时显示滚动条

当菜单在原有定位且已经达到最大高度时，还是会超出可视区域，则菜单会自动上下移动，使其完整可见且页面不会出现滚动条

## 使用方式

1. 组件调用

需要自己手动控制 show，组件会默认相对于父元素定位（搭配 position 属性）

```html
const show = ref(false);
<div @pointerenter="show = true" @pointerleave="show = false">
  菜单
  <MultiMenu :data="menuData" :show="show" position="lt" />
</div>

<div @pointerenter="show = true" @pointerleave="show = false">
  或者指定相对的定位元素，支持传入dom对象或者选择器
  <MultiMenu
    :data="menuData"
    :show="true"
    relative-dom="#MENU-BTN"
    position="lt"
  />
</div>
```

2. 指令式调用

简洁。只能通过 hover 控制显示隐藏；懒加载：只有在首次 hover 时才会创建元素

```html
<div v-mutil-menu:tr="menuData">菜单</div>
```

3. 命令式调用（有空再写）

```ts

```

## 探索记录

- 为什么不用 css hover 来控制子菜单的显示

因为菜单和菜单间有间隙，在抖音的菜单中，如果鼠标快速滑入子菜单，子菜单是不会消失的

而如果用 hover ，鼠标在滑入菜单间空隙时，响应速度很快，子菜单就消失了

所以必须用 js 去加入一个鼠标移动延迟响应。
