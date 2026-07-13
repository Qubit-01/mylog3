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

/** 参数装饰器：读取当前用户 id；公开路由未登录时返回 undefined */
export const UserId = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): number | undefined =>
    ctx.switchToHttp().getRequest<Request>().user?.sub,
);

/**
 * 全局 JWT 校验守卫（AuthModule 里以 APP_GUARD 注册）
 * - 默认所有路由都是公开的，有 token 时仍会解析可选用户身份
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
    const req = ctx.switchToHttp().getRequest<Request>();
    const token = req.cookies?.token as string | undefined;
    const user = token
      ? await this.jwt.verifyAsync<JwtPayload>(token).catch(() => undefined)
      : undefined;

    if (user && Number.isSafeInteger(user.sub) && user.sub > 0) {
      req.user = user;
    } else if (needAuth) {
      throw new UnauthorizedException('未登录或登录已过期');
    }

    return true;
  }
}
