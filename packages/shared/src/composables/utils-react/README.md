# Utils KRN

众所周知，React 的生命周期钩子调用是极其难用的。

比如我想在数据更新后再调用，并且只调用一次。

这里提供了一些可靠的方便的 Hook。

---

## Hooks

> 以下按 Hook 名字典顺序排序

### useAppState

判断页面显隐状态 用于任务列表请求

- `appState`: destroy页面销毁 show页面出现 hide页面隐藏 active页面在前台 background页面在后台 【iOS特有】inactive页面悬挂
- `isHidden`: 页面显隐状态，布尔值

@see https://kds.corp.kuaishou.com/kds-react/detail?detailId=142&showSideNav=1&menuId=21

常用于用于前后台切换后的任务列表请求

```ts
// 用法1: 只拿状态
const { appState, isHidden } = useAppState()
// 用法2: 挂事件
useAppState(() => {}, { immediate: true })
```

### useEffectUpdate

忽略首次执行，只在依赖更新时执行

```ts
useEffectUpdate(() => {}, [data])
```

### useEffectUpdateOnce

忽略首次执行，只在依赖更新时执行，且仅执行一次

常用于主接口数据首次变化的埋点。

```ts
useEffectUpdateOnce(() => {}, [data])
```

### usePushPermission

通知权限hook

- `permitted`: 会自动检测权限变化

```ts
const { permitted } = usePushPermission()
```

### useRefSync

返回一个依赖变化时同步更新的 Ref 对象

常用于闭包里要取最新的值。

```ts
const xxxRef = useRefSync(() => ({ test: data.xxx }), [data])
```

---

## Utils

### getPushPermission

判断是否开启通知权限

开启返回 true，未开启或获取失败返回 false

### openPushPermission

拉起通知权限页面

返回不重要

---

## OnCall

有bug？有问题？Better Call liaoshiqiang！
