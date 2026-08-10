import type { CookieOptions } from 'express';

/** 认证 Cookie 基础配置：httpOnly + sameSite lax，生产环境启用 secure */
export const COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  path: '/',
  secure: process.env.NODE_ENV === 'production',
};

/** 本站登录 Cookie：有效期 60 天 */
export const AUTH_COOKIE_OPTIONS: CookieOptions = {
  ...COOKIE_OPTIONS,
  maxAge: 60 * 24 * 60 * 60 * 1000, // 60 天
};

/** OAuth 临时 Cookie：有效期 10 分钟 */
export const OAUTH_COOKIE_OPTIONS: CookieOptions = {
  ...COOKIE_OPTIONS,
  maxAge: 10 * 60 * 1000,
};
