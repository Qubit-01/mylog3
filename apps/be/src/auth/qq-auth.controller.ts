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
import { Auth, UserId } from './auth.guard';
import { QqAccessTokenDto } from './dto/qq.dto';
import { QqAuthService } from './qq-auth.service';

@ApiTags('auth')
@Controller('auth/qq')
export class QqAuthController {
  constructor(private readonly qqAuthService: QqAuthService) {}

  /** 验证前端 QQ SDK 登录态；已绑定则登录，未绑定则返回 404 */
  @Post('login')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBody({ type: QqAccessTokenDto })
  @ApiNoContentResponse({ description: 'QQ 已绑定，本站登录成功' })
  async login(
    @Body() dto: QqAccessTokenDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    res.cookie(
      'token',
      await this.qqAuthService.login(dto.accessToken),
      AUTH_COOKIE_OPTIONS,
    );
  }

  /** 验证 QQ 登录态并绑定到当前登录账号 */
  @Post('bind')
  @Auth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBody({ type: QqAccessTokenDto })
  @ApiNoContentResponse({ description: 'QQ 已绑定到当前账号' })
  async bind(
    @UserId() userId: number,
    @Body() dto: QqAccessTokenDto,
  ): Promise<void> {
    await this.qqAuthService.bind(userId, dto.accessToken);
  }
}
