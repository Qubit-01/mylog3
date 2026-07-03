import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { Logger, LoggerErrorInterceptor } from 'nestjs-pino';

import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // 先把 bootstrap 期间的日志缓存起来，等 pino Logger 就绪后统一 flush
    bufferLogs: true,
  });

  // 把 Nest 内建日志（含 bootstrap / 路由映射）也接管到 pino
  app.useLogger(app.get(Logger));
  // 让抛出的异常在日志 `err` 字段里保留完整堆栈和错误类，官方推荐
  app.useGlobalInterceptors(new LoggerErrorInterceptor());
  // 全局异常兜底：把所有 error 转成结构化 JSON 返回给前端
  app.useGlobalFilters(new AllExceptionsFilter());

  // 解析 Cookie（认证 token 走 httpOnly cookie）
  app.use(cookieParser());

  // 全局参数校验：自动剔除 DTO 之外字段，并把 JSON 转 class 实例
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // 自动剔除 DTO 未声明的字段，避免脏数据入参
      transform: true, // 把请求 JSON 转成 DTO 类实例，并按类型做隐式转换（如 string → number）
      forbidNonWhitelisted: false, // 遇到多余字段是否直接 400 抛错；false 表示只静默剔除不报错
    }),
  );

  // 开放 CORS 给前端
  app.enableCors({ origin: true, credentials: true });

  // Swagger UI：/docs 提供在线接口面板，/docs-json 直出 spec
  const swaggerConfig = new DocumentBuilder()
    .setTitle('mylog3 API')
    .setDescription('后端接口文档 — 前端通过 openapi-typescript 生成类型')
    .setVersion('1.0')
    .build();
  const swaggerFactory = () => SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, swaggerFactory);

  await app.listen(process.env.PORT ?? 20914);
}

void bootstrap();
