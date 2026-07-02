import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';

/**
 * 认证模块
 * - JwtModule 全局注册，SecretKey 从 `.env` 读取
 * - APP_GUARD 注册全局 AuthGuard，默认所有路由都是公开的；用 `@Auth()` 声明需要登录
 */
@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: process.env.SecretKey,
      signOptions: { expiresIn: '60d' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, { provide: APP_GUARD, useClass: AuthGuard }],
})
export class AuthModule {}
