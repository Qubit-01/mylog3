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
    const extra = isHttp ? exception.getResponse() : null;

    this.logger[status >= 500 ? 'error' : 'warn'](
      { err: exception },
      err.message,
    );
    host
      .switchToHttp()
      .getResponse<Response>()
      .status(status)
      .json({
        // HttpException 官方 body 里的额外字段（如 ValidationPipe 的 message: string[]）
        ...(typeof extra === 'object' && extra),
        statusCode: status,
        name: err.name,
        message: err.message,
        stack: err.stack,
      });
  }
}
