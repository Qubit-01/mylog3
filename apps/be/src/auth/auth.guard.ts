import {
  CanActivate,
  createParamDecorator,
  ExecutionContext,
  Injectable,
  SetMetadata,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';

/** JWT payload，只装 userId */
interface JwtPayload {
  sub: number;
}

// 让 express 的 Request.user 有类型，Guard 校验通过后挂载
declare module 'express' {
  interface Request {
    user?: JwtPayload;
  }
}

/** 标记路由（或整个 Controller）需要登录，未标记默认公开 */
const IS_AUTH_KEY = 'isAuth';
export const Auth = () => SetMetadata(IS_AUTH_KEY, true);

/** 参数装饰器：拿当前登录用户 id，用法 `fn(@UserId() userId: number)` */
export const UserId = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): number =>
    ctx.switchToHttp().getRequest<Request>().user!.sub,
);

/**
 * 全局 JWT 校验守卫（AuthModule 里以 APP_GUARD 注册）
 * - 默认所有路由都是公开的（不打注解就免鉴权）
 * - 用 `@Auth()` 装饰器（方法或类）声明需要登录
 * - 校验通过后把 payload 挂到 `req.user`
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const needAuth = this.reflector.getAllAndOverride<boolean>(IS_AUTH_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!needAuth) return true;

    const req = ctx.switchToHttp().getRequest<Request>();
    try {
      req.user = await this.jwt.verifyAsync<JwtPayload>(
        req.cookies?.token as string,
      );
      return true;
    } catch {
      throw new UnauthorizedException('未登录或登录已过期');
    }
  }
}
