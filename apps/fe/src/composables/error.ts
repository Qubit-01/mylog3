import { get } from 'lodash-unified'
import { serializeError } from 'serialize-error'

/** 序列化未知异常，并将浏览器事件的内部错误映射为标准 cause 层级。@returns 格式化后的错误详情 */
export const stringifyError = (error: unknown) => {
  const detail = serializeError(error)
  const cause = get(error, 'target.error')
  if (cause) detail.cause = serializeError(cause)
  return JSON.stringify(detail, null, 2)
}
