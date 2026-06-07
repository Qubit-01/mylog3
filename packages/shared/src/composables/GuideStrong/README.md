# GuideStrong 强引导组件

框选元素，动态控制挖孔大小。

## 实现方式

通过 `box-shadow` 属性实现挖孔蒙层。

## 插槽

-   default  
    插入的元素将被渲染在挖孔内部
-   on-mask  
    插入的元素将被渲染在蒙层上面，定位点是可视区域左上角

## 一些点

-   老版本低端机兼容  
    在ios老版本中，0宽高的div不会渲染box-shadow，在此组件中如果传入0px，会自动转为0.1px
-   帧率控制
    动态控制div的某些css属性时，可能会导致性能损耗，可通过 `--quantum-GuideStrong-steps` CSS变量控制变化速率

## 文件结构

-   demos
    -   demo.vue 是组件的 demo
-   index.vue 根组件  
    需要自己设置 `click-inner` 和 `click-mask` 事件来控制步数，以及控制整个蒙层的淡入淡出动画
