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
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /** 注册账号，注册即登录：Set-Cookie(token) + 204 */
  @Post('register')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBody({ type: RegisterDto })
  @ApiNoContentResponse({
    description: '注册成功，token 已写入 httpOnly cookie',
  })
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    res.cookie(
      'token',
      await this.authService.register(dto),
      AUTH_COOKIE_OPTIONS,
    );
  }

  /** 登录：Set-Cookie(token) + 204 */
  @Post('login')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBody({ type: LoginDto })
  @ApiNoContentResponse({
    description: '登录成功，token 已写入 httpOnly cookie',
  })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    res.cookie('token', await this.authService.login(dto), AUTH_COOKIE_OPTIONS);
  }

  /** 登出：幂等清 cookie，即使未登录调用也无副作用 */
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({ description: '登出，清除认证 cookie' })
  logout(@Res({ passthrough: true }) res: Response): void {
    res.clearCookie('token', { path: '/' });
  }
}
