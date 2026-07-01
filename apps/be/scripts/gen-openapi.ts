/**
 * 离线生成 OpenAPI spec 到磁盘
 * - 用途：`pnpm gen:openapi` 触发，产出 apps/be/openapi.json
 * - fe 通过 `pnpm gen:api` 从这份 JSON 生成类型
 * - 会启动完整 Nest 生命周期，包含数据库连接；本地跑前先确保 DB 可达
 */
import 'dotenv/config';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from '../src/app.module';

async function main() {
  const app = await NestFactory.create(AppModule, { logger: false });

  const config = new DocumentBuilder()
    .setTitle('mylog3 API')
    .setDescription('后端接口文档 — 前端通过 openapi-typescript 生成类型')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);

  const outPath = resolve(__dirname, '../openapi.json');
  writeFileSync(outPath, JSON.stringify(document, null, 2), 'utf-8');
  console.log(`[gen-openapi] spec written to ${outPath}`);

  await app.close();
}

void main();
