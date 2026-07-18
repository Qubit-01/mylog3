/**
 * 把资源引用转成可访问地址。
 * @param url 完整 URL 或 COS object key
 * @returns 可直接用于浏览器资源标签的 HTTPS 地址
 */
export const toResourceUrl = (url: string) => {
  if (url.startsWith('http://')) return url.replace('http://', 'https://')
  if (url.startsWith('https://')) return url
  return `https://cos.mylog.ink/${url}`
}
