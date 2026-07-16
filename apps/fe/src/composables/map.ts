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
      plugins: [
        'AMap.CitySearch',
        'AMap.Geolocation',
        'AMap.Geocoder',
        'AMap.MarkerCluster',
        // 'AMap.Scale',
      ],
    }),
  )

/** `AMap.LngLat` 对象转 `[lng, lat]` 元组，方便与高德接口的 `Vector2` 参数互通 */
export const l2v = (p: AMap.LngLat): AMap.Vector2 => [p.lng, p.lat]

/**
 * 公共定位对象（懒加载单例）。
 * 首次调用触发 SDK 加载和构造，之后复用；构造本身不触发权限询问，具体方法调用时才询问。
 * 默认 PC 端先精确 IP 定位、失败后浏览器定位，手机端反之。
 * @see https://lbs.amap.com/api/javascript-api-v2/documentation#geolocation
 */
let _geolocation: Promise<AMap.Geolocation> | null = null
export const getGeolocation = () =>
  (_geolocation ??= getAMap().then(
    (AMap) =>
      new AMap.Geolocation({
        enableHighAccuracy: true, // 是否使用高精度定位，默认：true
        timeout: 10000, // 设置定位超时时间，默认：无穷大
        // convert: true, //自动偏移坐标，偏移后的坐标为高德坐标，默认：true
        // getCityWhenFail: true, // 定位失败之后是否返回基本城市定位信息
        needAddress: true, // 是否需要将定位结果进行逆地理编码操作
        // extensions: 'all', // 是否需要详细的逆地理编码信息,是否需要周边POI、道路交叉口等信息，默认为'base'只返回基本信息，可选'all',将返回周边POI、道路交叉口等信息
        showButton: false, // 是否显示定位按钮，true
        // buttonPosition: 'LB', // 定位按钮可停靠的位置 LT左上角 LB左下角 RT右上角 RB右下角 默认LB
        // buttonOffset: Pixel(10,20) // 按钮距离停靠位置的偏移量 默认Pixel(10,20)
        // showMarker: false, // 定位成功时是否在定位位置显示一个Marker true
        // showCircle: true, //定位成功后用圆圈表示定位精度范围，默认：true
        panToLocation: false, // 定位成功后，是否把定位得到的坐标设置为地图中心点坐标 true
        // zoomToAccuracy: false,  // 定位成功且显示精度范围时，是否把地图视野调整到正好显示精度范围 false
      }),
  ))

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
  // SDK 加载是异步的，若等待期间组件已卸载，需要放弃后续初始化，避免创建孤儿地图实例
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

/** 类型定义 **********************************/

declare global {
  namespace AMap {
    interface CitySearchResult {
      bounds: AMap.Bounds
      city: string
      province: string
      info: string
    }

    interface Control {
      addTo(map: AMap.Map): void
      remove(): void
      show(): void
      hide(): void
    }

    /** IP 定位 */
    class CitySearch {
      constructor()
      /** 指定 IP 查询城市；无权限也可用，但代理下可能拿不到结果 */
      getCityByIp(
        ip: string,
        callback: (status: string, result: CitySearchResult) => void,
      ): void
      getLocalCity(
        callback: (status: string, result: CitySearchResult) => void,
      ): void
    }

    /** 浏览器定位控件 */
    class Geolocation extends Control {
      constructor(options?: any)
      getCurrentPosition(callback: (status: string, result: any) => void): void
      getCityInfo(callback: (status: string, result: any) => void): void
    }

    /** 逆地理编码 */
    class Geocoder {
      constructor(options?: any)
      getAddress(
        lnglat: any,
        callback: (status: string, result: any) => void,
      ): void
    }
  }
}
