import { Module } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { LoggerModule } from 'nestjs-pino';

/**
 * 全局日志模块 —— nestjs-pino + pino-http。
 *
 * 依赖 `AsyncLocalStorage`，让 controller / service / repo 里任意 `Logger` 调用
 * 都自动携带请求上下文（`req.id` 等），无需手动传递。
 *
 * @see https://github.com/iamolegga/nestjs-pino
 */
const isProd = process.env.NODE_ENV === 'production';

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        level: isProd ? 'info' : 'debug',
        // 复用前端传入的 X-Request-ID，否则生成 uuid；并回写响应头方便前后端串联
        genReqId: (req, res) => {
          const incoming = req.headers['x-request-id'];
          const id =
            typeof incoming === 'string' && incoming ? incoming : randomUUID();
          res.setHeader('x-request-id', id);
          return id;
        },
        // dev 走 pino-pretty；prod 直接 stdout JSON 交给日志采集
        transport: isProd
          ? undefined
          : {
              target: 'pino-pretty',
              options: { singleLine: true, translateTime: 'SYS:HH:MM:ss.l' },
            },
        // 敏感字段脱敏
        redact: {
          paths: [
            'req.headers.authorization',
            'req.headers.cookie',
            'req.body.pswd',
            'req.body.password',
          ],
          censor: '[REDACTED]',
        },
      },
    }),
  ],
})
export class AppLoggerModule {}
