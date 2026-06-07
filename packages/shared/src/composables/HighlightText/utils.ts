export const RegExp_Highlight = /\$\{([^}]+?)\}/g

/**
 * 获取高亮对象
 * @param text 内容
 * @return 高亮对象数组
 *
 * @example getHighlights('哈${高亮}哈')
 * 返回: [{text: '哈', highlight: false}, {text: '高亮', highlight: true}, {text: '哈', highlight: false}]
 */
export const getHighlights = (
  text: string,
): { text: string; highlight: boolean }[] => {
  const highlights: { text: string; highlight: boolean }[] = []
  const matchs = text.match(RegExp_Highlight)
  if (matchs === null) {
    return [{ text: text, highlight: false }]
  }

  let start = 0
  for (const match of matchs) {
    const i = text.indexOf(match, start)
    if (i > start) {
      highlights.push({ text: text.slice(start, i), highlight: false })
    }
    highlights.push({ text: match.slice(2, -1), highlight: true })
    start = i + match.length
  }
  if (start < text.length) {
    highlights.push({ text: text.slice(start), highlight: false })
  }
  return highlights
}

/**
 * 替换高亮对象
 * 和 String.prototype.replace 类似，但只替换 ${} 包裹的内容
 * 参二数可为字符串或函数
 *   字符串的话就直接替换所有的 ${xxx}
 *   参数会传入(${xxx}, xxx) ，返回的字符串会替换 ${xxx}
 *
 * @example
 * replaceHighlights('坚持打卡${remainSignInDays}天', (_, k) => data[k]);
 */
export const replaceHighlights = (
  text: string,
  replacer: string | ((substring: string, ...args: any[]) => string),
) => {
  return text.replace(
    RegExp_Highlight,
    typeof replacer === 'function' ? replacer : () => replacer,
  )
}
