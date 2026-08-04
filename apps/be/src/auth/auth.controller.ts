import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Res,
} from '@nestjs/common';
import { ApiBody, ApiNoContentResponse, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { AUTH_COOKIE_OPTIONS } from './auth.constants';
import { AuthService } from './auth.service';
import { SignInDto } from './dto/sign-in.dto';
import { SignUpDto } from './dto/sign-up.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /** 注册账号，注册即登录：Set-Cookie(token) + 204 */
  @Post('sign-up')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBody({ type: SignUpDto })
  @ApiNoContentResponse({
    description: '注册成功，token 已写入 httpOnly cookie',
  })
  async signUp(
    @Body() dto: SignUpDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    res.cookie(
      'token',
      await this.authService.signUp(dto),
      AUTH_COOKIE_OPTIONS,
    );
  }

  /** 登录：Set-Cookie(token) + 204 */
  @Post('sign-in')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBody({ type: SignInDto })
  @ApiNoContentResponse({
    description: '登录成功，token 已写入 httpOnly cookie',
  })
  async signIn(
    @Body() dto: SignInDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    res.cookie(
      'token',
      await this.authService.signIn(dto),
      AUTH_COOKIE_OPTIONS,
    );
  }

  /** 登出：幂等清 cookie，即使未登录调用也无副作用 */
  @Post('sign-out')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({ description: '登出，清除认证 cookie' })
  signOut(@Res({ passthrough: true }) res: Response): void {
    res.clearCookie('token', { path: '/' });
  }
}
