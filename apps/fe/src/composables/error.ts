import { get } from 'lodash-unified'
import { serializeError } from 'serialize-error'

/** 序列化未知异常，并保留浏览器事件的 target.error 层级。@returns 格式化后的错误详情 */
export const stringifyError = (error: unknown) => {
  const detail = serializeError(error)
  const targetError = get(error, 'target.error')
  if (targetError) detail.target = { error: serializeError(targetError) }
  return JSON.stringify(detail, null, 2)
}
