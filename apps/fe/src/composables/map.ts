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

/** 兜底坐标：成都天府广场 */
const 天府广场: AMap.Vector2 = [104.065739, 30.657452]

/****************
 * 定位
 * Ip定位
 * - getCityByIp 获取城市，不要权限，可能为空
 * Geo定位
 * - getPositionByGeo 获取当前精确位置，要权限
 * - getCityInfoByGeo 获取城市信息，不要权限，不会为空
 ****************/

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
 * IP定位: 根据IP返回对应城市信息。不要权限，但有代理时不会返回结果
 * @param ip 指定ip查询，可以不传，就自动获取ip
 * @returns Promise<{bounds.getCenter()才是中心点, ...}>
 * @see https://lbs.amap.com/api/javascript-api-v2/documentation#citysearch
 * status:
 *   complete => result为CitySearchResult
 *   error => result为错误信息info
 *   no_data => 代表检索返回0结果，result空对象
 */
export const getCityByIp = async (ip?: string) => {
  const AMap = await getAMap()
  return new Promise<AMap.CitySearchResult>((resolve, reject) => {
    const citySearch = new AMap.CitySearch()
    const cb = (status: string, result: AMap.CitySearchResult) => {
      console.info('getCityByIp', status, result)
      if (status === 'complete' && result.info === 'OK') resolve(result)
      else reject({ status, result })
    }
    ip ? citySearch.getCityByIp(ip, cb) : citySearch.getLocalCity(cb)
  })
}

/**
 * 获取精确位置，有失败几率，浏览器定位，要权限。有几率失败，可能是因为没给权限
 * 并且 getCurrentPosition 方法会触发地图展示当前坐标
 * @param 可以自己传入，没有权限时，不会有坐标
 * @return Promise<{position坐标对象, ...}>
 * error =>
 *     message: "Get ipLocation failed.Geolocation permission denied."
 *     originMessage: "User denied Geolocation"
 */
export const getPositionByGeo = async (gl?: AMap.Geolocation) => {
  const geolocation = gl ?? (await getGeolocation())
  return new Promise<{ position: AMap.LngLat }>((resolve, reject) => {
    geolocation.getCurrentPosition((status: string, result: any) => {
      console.info('getPositionByGeo', status, result)
      status === 'complete' ? resolve(result) : reject({ status, result })
    })
  })
}

/**
 * 获取当前城市信息，浏览器定位，不要权限。而且在使用代理时，也会通过ip返回结果，有几率失败
 * @returns Promise<{position坐标数组, ...}>
 */
export const getCityInfoByGeo = async (gl?: AMap.Geolocation) => {
  const geolocation = gl ?? (await getGeolocation())
  return new Promise<{ position: AMap.Vector2 }>((resolve, reject) => {
    geolocation.getCityInfo((status: string, result: any) => {
      console.info('getCityInfoByGeo', status, result)
      status === 'complete' ? resolve(result) : reject({ status, result })
    })
  })
}

/** 不管有没有权限都要给出一个坐标，天府广场兜底 */
export const getPosition = async (gl?: AMap.Geolocation) =>
  getPositionByGeo(gl)
    .then((res) => l2v(res.position))
    .catch(() =>
      getCityInfoByGeo(gl).then((res) => res.position as AMap.Vector2),
    )
    .catch(() => getCityByIp().then((res) => l2v(res.bounds.getCenter())))
    .catch(() => 天府广场)

/** 坐标转描述 */
export const getAddress = async (p: AMap.Vector2) => {
  const AMap = await getAMap()
  const geocoder = new AMap.Geocoder({
    // city: '',
    // radius: 1000,
    // batch: false,
    // extensions: 'all',
  })
  return new Promise<any>((resolve, reject) => {
    geocoder.getAddress(p, (status: string, result: any) => {
      status === 'complete' && result.info === 'OK'
        ? resolve(result.regeocode)
        : reject([status, result])
    })
  })
}

/**
 * 连接 Vue 生命周期与高德地图实例。
 * 底图样式自动跟随 `useColorMode()`：暗色模式走 `dark` 底图，其它走 `normal`。
 * @param container 地图容器模板引用
 * @param options 地图初始化选项，会与内置默认值浅合并
 */
export const useAMap = (
  container: Readonly<Ref<HTMLElement | null>>,
  options?: AMap.MapOptions,
) => {
  const map = shallowRef<AMap.Map>()
  const geolocation = shallowRef<AMap.Geolocation>()
  const error = ref('')
  // 已解析的颜色模式（'dark' | 'light'，auto 会被 VueUse 自动解析）
  const mode = useColorMode()
  const mapStyle = computed(
    () => `amap://styles/${mode.value === 'dark' ? 'dark' : 'normal'}`,
  )

  onMounted(async () => {
    try {
      const AMap = await getAMap()
      if (!container.value) return

      map.value = new AMap.Map(container.value, {
        zoom: 17, // 地图级别
        // center: 天府广场,
        mapStyle: mapStyle.value,
        ...options,
      })

      // 定位控件与地图强绑定：坐标系偏移、marker、精度圈都依赖 map 上下文，随 map 一起销毁
      // 也作为编程式定位入口（`getPositionByGeo(geolocation)` 等）——同一实例既是控件又是工具
      geolocation.value = new AMap.Geolocation({
        enableHighAccuracy: true, // 是否使用高精度定位，默认:true
        timeout: 10000, // 超过10秒后停止定位，默认：无穷大
        panToLocation: false,
      })
      geolocation.value!.addTo(map.value!)
      geolocation.value!.hide()

      map.value!.setCenter(await getPosition(geolocation.value), true)
    } catch (e) {
      error.value = e instanceof Error ? e.message : '高德地图加载失败'
    }
  })

  // 颜色模式变化时同步切换底图
  watch(mapStyle, (style) => map.value?.setMapStyle(style))

  onUnmounted(() => {
    map.value?.destroy()
  })

  return {
    /** 当前地图实例；SDK 加载与组件挂载完成前为空 */
    map,
    /** 定位控件（默认隐藏，无按钮 UI）；也可以传给 `getPositionByGeo` 等做编程式定位 */
    geolocation,
    /** 地图初始化失败信息，空字符串表示无错误 */
    error,
  }
}
