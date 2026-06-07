# HighlightText 文本高光

## 场景

对于含有 `${}` 格式的文本，用 `<span class='highlight'></span>` 标签包裹

常用于 kconf 中的文案简单样式添加

如: `哈哈哈${高光}哈哈哈${高光中的${高光}试试}哈哈哈${惰性}匹配}哈哈哈`

会转为: `哈哈哈<span class="highlight">高光</span>哈哈哈<span class="highlight">高光中的${高光</span>试试}哈哈哈<span class="highlight">惰性</span>匹配}哈哈哈`

## 注意点

- 惰性匹配  
  监测到 `${` 后只会匹配到后续的首个 `}`
- 必须使用 :deep() 添加高光样式  
  是由于 Vue 中的 `style scoped` 的 Hash 限制
- ~~无根元素  
  出于避免徒增结构变化的考虑，转换出来的结果中没有根dom~~
- 属性透传  
  所有加在组件上的属性，都会透传到内部的span元素上

## 附赠两个方法

### getHighlights

获取高亮对象

@param text 内容

@return 高亮对象数组

```js
// 调用
getHighlights('哈${高亮}哈')
// 返回
;[
  { text: '哈', highlight: false },
  { text: '高亮', highlight: true },
  { text: '哈', highlight: false },
]
```

### replaceHighlights

替换高亮对象

和 String.prototype.replace 类似，但只替换 ${} 包裹的内容

参二数可为字符串或函数

字符串的话就直接替换所有的 ${xxx}
  参数会传入(${xxx}, xxx) ，返回的字符串会替换 ${xxx}

```js
// 调用：其中 sub='${signInDays}', key='signInDays'
replaceHighlights('坚持打卡${signInDays}天', (sub, key) => data[key])
// 返回
;('坚持打卡99天')
```
