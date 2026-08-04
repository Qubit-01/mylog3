import type { CookieOptions } from 'express';

/** 认证 cookie 通用配置：httpOnly + sameSite lax + 60 天，生产走 secure */
export const AUTH_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  path: '/',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 60 * 24 * 60 * 60 * 1000, // 60 天
};
