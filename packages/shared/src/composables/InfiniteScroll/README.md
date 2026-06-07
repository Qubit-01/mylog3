# InfiniteScroll 无限滚动指令

滚动至底部时，加载更多数据

## 基础用法

在要实现滚动加载的列表上添加v-infinite-scroll，并赋值相应的加载方法，可实现滚动到底部时自动执行加载方法。

## 指令

| 属性                      | 描述                                                 | 类型        | 默认  |
| ------------------------- | ---------------------------------------------------- | ----------- | ----- |
| v-infinite-scroll         | 滚动到底部时，加载更多数据                           | ^[Function] | —     |
| infinite-scroll-disabled  | 是否禁用                                             | ^[boolean]  | false |
| infinite-scroll-delay     | 节流时延，单位为ms                                   | ^[number]   | 200   |
| infinite-scroll-distance  | 触发加载的距离阈值，单位为px                         | ^[number]   | 1     |
| infinite-scroll-immediate | 是否立即执行加载方法，以防初始状态下内容无法撑满容器 | ^[boolean]  | true  |

## 依赖

- lodash-unified
- @vueuse/core

## 探索记录

### scrollTop 精度问题

当滚动条滑到底时，scrollTop 可能不是精准的。

scrollTop + clientHeight 和 scrollHeight 不一定是相等的

比如：元素高度clientHeight = 800px，元素滚动高度scrollHeight = 900px。预期滚到底部，scrollTop为100px，但是实际上可能为99.5px。

简单说就是 某些时候滚动条永远不会触底，会有0.几的误差，导致callback永远不会被执行。

试着调整页面放大倍率，这种现象复现得尤为明显

@see https://developer.mozilla.org/zh-CN/docs/Web/API/Element/scrollTop

MDN上解释到，scrollTop值是亚像素精度的，这意味着它不一定是一个整数

结论：某些时刻，infinite-scroll-distance = 0 时，会因为触发[滚动条无法触底]，而永远触发不了callback

解决方案：distance 最小为1px
