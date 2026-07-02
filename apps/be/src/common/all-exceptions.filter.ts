import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';

/**
 * 全局异常兜底：把任何错误尽可能原样吐给前端。
 *
 * `Error` 的 `name / message / stack` 都是不可枚举属性，无法直接 `JSON.stringify`，
 * 所以必须手工提取。对 `HttpException`，官方 body 里可能带 `message: string[]`
 * (ValidationPipe) / `error: 'Bad Request'` 等更详细字段，直接 spread 保留。
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const err =
      exception instanceof Error ? exception : new Error(String(exception));
    const isHttp = exception instanceof HttpException;
    const status = isHttp ? exception.getStatus() : 500;
    /**
     * `getResponse()` 官方两种形态：string 或 `{ statusCode, message, error }`；
     * ValidationPipe 会把字段错误塞在 `message: string[]` 里，需要 join 优先取用，
     * 否则会被外层 "Bad Request Exception" 覆盖。
     */
    const resp = isHttp ? exception.getResponse() : null;
    const body =
      typeof resp === 'string'
        ? { message: resp }
        : ((resp ?? {}) as Record<string, unknown>);
    const message = Array.isArray(body.message)
      ? body.message.join('; ')
      : ((body.message as string | undefined) ?? err.message);

    this.logger[status >= 500 ? 'error' : 'warn'](
      { err: exception },
      err.message,
    );
    host
      .switchToHttp()
      .getResponse<Response>()
      .status(status)
      .json({
        ...body,
        statusCode: status,
        name: err.name,
        message,
        // 4xx 是预期业务错误，不返回 stack；5xx 才附带堆栈方便前端排查
        ...(status >= 500 && { stack: err.stack }),
      });
  }
}
