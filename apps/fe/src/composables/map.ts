import '@amap/amap-jsapi-types'

Object.assign(globalThis, {
  /** 高德安全配置：由线上 Nginx 代理追加 securityJsCode */
  _AMapSecurityConfig: {
    serviceHost: 'https://mylog.ink/_AMapService',
  },
})

/**
 * 获取高德 JS API；官方 Loader 内部复用已加载资源，多处地图不会重复请求 SDK。
 * Loader 使用动态导入，只有真正访问地图功能时才进入页面产物。
 */
export const getAMap = () =>
  import('@amap/amap-jsapi-loader').then(({ default: loader }) =>
    loader.load({
      key: '3e157c0915ab643cb42b74eb4c943cf5',
      version: '2.0',
      plugins: [],
    }),
  )

/**
 * 连接 Vue 生命周期与高德地图实例。
 * @param container 地图容器模板引用
 * @param options 地图初始化选项
 */
export const useAMap = (
  container: Readonly<Ref<HTMLElement | null>>,
  options?: AMap.MapOptions,
) => {
  const map = shallowRef<AMap.Map>()
  const pending = ref(true)
  const error = ref('')
  let disposed = false

  onMounted(async () => {
    try {
      const AMap = await getAMap()
      if (disposed || !container.value) return
      const instance = new AMap.Map(container.value, options)
      map.value = instance
      instance.on('complete', () => {
        pending.value = false
      })
    } catch (e) {
      pending.value = false
      error.value = e instanceof Error ? e.message : '高德地图加载失败'
    }
  })

  onUnmounted(() => {
    disposed = true
    map.value?.destroy()
    map.value = undefined
  })

  return {
    /** 当前地图实例；SDK 加载与组件挂载完成前为空 */
    map,
    /** 地图资源或图面是否仍在加载 */
    pending,
    /** 地图初始化失败信息，空字符串表示无错误 */
    error,
  }
}
