import { useClipboardItems } from '@vueuse/core'
import MarkdownIt from 'markdown-it'

export const markdownIt = new MarkdownIt({
  breaks: true,
  html: true,
  linkify: true,
})

/**
 * 把 markdown 原文渲染为 html，并以富文本形式写入系统剪贴板
 * @param markdown 要复制的 markdown 原文
 * @returns 返回 `useClipboardItems().copy(...)` 的 Promise，成功时表示剪贴板写入完成
 */
export const copyRichText4Markdown = async (markdown: string) => {
  const { copy } = useClipboardItems()
  const html = markdownIt.render(markdown)
  return copy([
    new ClipboardItem({
      'text/html': new Blob([html], { type: 'text/html' }),
      'text/plain': new Blob([html], { type: 'text/plain' }),
    }),
  ])
}
