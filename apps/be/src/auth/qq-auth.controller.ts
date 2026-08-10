import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import {
  ApiBody,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import {
  AUTH_COOKIE_OPTIONS,
  COOKIE_OPTIONS,
  OAUTH_COOKIE_OPTIONS,
} from './auth.constants';
import { Auth, UserId } from './auth.guard';
import {
  QqCallbackDto,
  QqCallbackResponseDto,
  QqStartDto,
  QqStartResponseDto,
} from './dto/qq.dto';
import { QqAuthService } from './qq-auth.service';

const QQ_OAUTH_COOKIE = 'qq-oauth';

@ApiTags('auth')
@Controller('auth/qq')
export class QqAuthController {
  constructor(private readonly qqAuthService: QqAuthService) {}

  /** 创建短期 state Cookie 并返回 QQ 授权地址 */
  @Post('start')
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: QqStartDto })
  @ApiOkResponse({ type: QqStartResponseDto, description: 'QQ 授权地址' })
  async start(
    @Body() dto: QqStartDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<QqStartResponseDto> {
    const { url, stateToken } = await this.qqAuthService.start(dto.redirect);
    res.cookie(QQ_OAUTH_COOKIE, stateToken, OAUTH_COOKIE_OPTIONS);
    return { url };
  }

  /** 校验 QQ 回调；已绑定时登录，未绑定时返回资料并保存短期身份 */
  @Post('callback')
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: QqCallbackDto })
  @ApiOkResponse({ type: QqCallbackResponseDto })
  async callback(
    @Body() dto: QqCallbackDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<QqCallbackResponseDto> {
    const result = await this.qqAuthService.callback(
      dto.code,
      dto.state,
      req.cookies?.[QQ_OAUTH_COOKIE] as string | undefined,
    );
    if (result.token) {
      res.cookie('token', result.token, AUTH_COOKIE_OPTIONS);
      res.clearCookie(QQ_OAUTH_COOKIE, COOKIE_OPTIONS);
    } else if (result.pendingToken) {
      res.cookie(QQ_OAUTH_COOKIE, result.pendingToken, OAUTH_COOKIE_OPTIONS);
    }
    return { redirect: result.redirect, profile: result.profile };
  }

  /** 使用 QQ 昵称和头像注册本站账号并登录 */
  @Post('sign-up')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({ description: 'QQ 注册并登录成功' })
  async signUp(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    res.cookie(
      'token',
      await this.qqAuthService.signUp(
        req.cookies?.[QQ_OAUTH_COOKIE] as string | undefined,
      ),
      AUTH_COOKIE_OPTIONS,
    );
    res.clearCookie(QQ_OAUTH_COOKIE, COOKIE_OPTIONS);
  }

  /** 将待处理的 QQ 身份绑定到当前登录账号 */
  @Post('bind')
  @Auth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({ description: 'QQ 已绑定到当前账号' })
  async bind(
    @UserId() userId: number,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    await this.qqAuthService.bind(
      userId,
      req.cookies?.[QQ_OAUTH_COOKIE] as string | undefined,
    );
    res.clearCookie(QQ_OAUTH_COOKIE, COOKIE_OPTIONS);
  }
}
