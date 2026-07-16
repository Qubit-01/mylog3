/**
 * 高德地图 JS API 2.0 插件类型声明。
 *
 * 官方 `@amap/amap-jsapi-types` 只包含核心类（Map/Marker/LngLat/Bounds 等），
 * 所有 plugin（Geolocation / Geocoder / CitySearch 等）都没有类型。
 * 本文件参考社区库 `Ludidi/amap-jsapi-plugins-types` 的字段清单，并按项目实际使用做了修正：
 * - Geolocation / CitySearch / Geocoder 的 callback 改为 `(status, result) => void` 函数签名（社区版被误写成 interface）；
 * - 补齐 `CitySearchResult.info` / `province` 等实际接口返回但社区未覆盖的字段。
 *
 * @see https://lbs.amap.com/api/jsapi-v2/documentation
 */

import '@amap/amap-jsapi-types'

declare global {
  namespace AMap {
    /* ================== AMap.Geolocation ================== */

    /**
     * 浏览器 / IP 定位控件。
     * @see https://lbs.amap.com/api/jsapi-v2/documentation#geolocation
     */
    class Geolocation {
      constructor(options?: GeolocationOptions)
      /** 获取用户的精确位置，有失败几率（浏览器定位，需权限） */
      getCurrentPosition(
        callback: (
          status: 'complete' | 'error',
          result: GeolocationResult,
        ) => void,
      ): void
      /** 根据用户 IP 获取所在城市信息 */
      getCityInfo(
        callback: (
          status: 'complete' | 'error',
          result: GeolocationResult,
        ) => void,
      ): void
      /** 将控件挂到地图实例上 */
      addTo(map: AMap.Map): void
      remove(): void
      show(): void
      hide(): void
    }

    interface GeolocationOptions {
      position?: string
      offset?: AMap.Vector2
      borderColor?: string
      borderRadius?: string
      buttonSize?: string
      convert?: boolean
      enableHighAccuracy?: boolean
      timeout?: number
      maximumAge?: number
      showButton?: boolean
      showCircle?: boolean
      showMarker?: boolean
      markerOptions?: AMap.MarkerOptions
      circleOptions?: AMap.CircleMarkerOptions
      panToLocation?: boolean
      zoomToAccuracy?: boolean
      GeoLocationFirst?: boolean
      noIpLocate?: number
      noGeoLocation?: number
      useNative?: boolean
      getCityWhenFail?: boolean
      needAddress?: boolean
      extensions?: string
    }

    interface GeolocationResult {
      position: AMap.LngLat
      accuracy: number
      location_type: number
      message: string
      isConverted: boolean
      info:
        | 'SUCCESS'
        | 'PERMISSION_DENIED'
        | 'TIME_OUT'
        | 'POSITION_UNAVAILABLE'
      addressComponent: AddressComponent
      formattedAddress: string
      pois: ReGeocodePoi[]
      roads: Road[]
      crosses: Cross[]
    }

    interface AddressComponent {
      province: string
      city: string
      citycode: string
      district: string
      adcode: string
      township: string
      street: string
      streetNumber: string
      neighborhood: string
      neighborhoodType: string
      building: string
      buildingType: string
      businessAreas: BusinessArea[]
    }

    interface BusinessArea {
      id: string
      name: string
      location: string
    }

    interface ReGeocodePoi {
      id: string
      name: string
      type: string
      tel: string
      distance: number
      direction: string
      address: string
      location: AMap.LngLat
      businessArea: string
    }

    interface Road {
      id: string
      name: string
      distance: number
      location: AMap.LngLat
      direction: string
    }

    interface Cross {
      distance: number
      direction: string
      location: AMap.LngLat
      first_id: string
      first_name: string
      second_id: string
      second_name: string
    }

    /* ================== AMap.CitySearch ================== */

    /**
     * 根据 IP 返回对应城市信息。
     * @see https://lbs.amap.com/api/jsapi-v2/documentation#citysearch
     */
    class CitySearch {
      constructor()
      /** 自动获取用户 IP 后返回本地城市 */
      getLocalCity(
        callback: (
          status: 'complete' | 'error' | 'no_data',
          result: CitySearchResult,
        ) => void,
      ): void
      /** 根据输入 IP 返回对应城市 */
      getCityByIp(
        ip: string,
        callback: (
          status: 'complete' | 'error' | 'no_data',
          result: CitySearchResult,
        ) => void,
      ): void
    }

    interface CitySearchResult {
      /** 结果状态；`'OK'` 表示查询成功 */
      info: string
      city: string
      province: string
      bounds: AMap.Bounds
    }

    /* ================== AMap.Geocoder ================== */

    /**
     * 地理编码 / 逆地理编码。
     * @see https://lbs.amap.com/api/jsapi-v2/documentation#geocoder
     */
    class Geocoder {
      constructor(opts?: GeocoderOptions)
      /** 将地址描述转为经纬度坐标 */
      getLocation(
        keyword: string,
        cbk: (status: string, result: GeocoderResult) => void,
      ): void
      setCity(city: string): void
      /** 将经纬度转为结构化地址描述 */
      getAddress(
        location: AMap.LngLat | AMap.Vector2,
        cbk: (status: string, result: ReGeocoderResult) => void,
      ): void
    }

    interface GeocoderOptions {
      city?: string | 'citycode' | 'adcode'
      radius?: number
      lang?: 'zh_cn' | 'en'
      batch?: boolean
      extensions?: 'base' | 'all'
    }

    interface GeocoderResult {
      info: string
      geocodes: Array<{
        formattedAddress: string
        country: string
        province: string
        city: string
        citycode: string
        district: string
        street: string
        number: string
        adcode: string
        location: AMap.LngLat
        level: string
      }>
    }

    interface ReGeocoderResult {
      info: string
      regeocode: {
        formattedAddress: string
        addressComponent: AddressComponent
      }
    }
  }
}

export {}
