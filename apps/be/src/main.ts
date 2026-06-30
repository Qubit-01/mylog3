import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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

  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
