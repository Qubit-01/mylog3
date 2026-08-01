/** 全局保留当前分享凭证，供默认布局和 TabBar 读取 */
export const useShareStore = defineStore('share', () => {
  /** 当前会话最近打开的分享凭证；undefined 表示尚未打开分享 */
  const token = ref<string>()

  return {
    /** 当前会话最近打开的分享凭证 */
    token,
  }
})
