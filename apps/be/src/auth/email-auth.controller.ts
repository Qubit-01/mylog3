import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Auth, UserId } from './auth.guard';
import { EmailAuthService } from './email-auth.service';
import {
  EmailBindDto,
  EmailSendCodeDto,
  EmailSendCodeResultDto,
} from './dto/email.dto';

/** 邮箱绑定与解绑只面向当前登录账号，不创建账号或切换登录身份 */
@ApiTags('auth')
@Auth()
@Controller('auth/email')
export class EmailAuthController {
  constructor(private readonly emailAuth: EmailAuthService) {}

  /** 向目标邮箱发送当前认证账号专用的验证码 */
  @Post('send-code')
  @ApiBody({ type: EmailSendCodeDto })
  @ApiCreatedResponse({ type: EmailSendCodeResultDto })
  sendCode(
    @UserId() userId: number,
    @Body() dto: EmailSendCodeDto,
  ): Promise<EmailSendCodeResultDto> {
    return this.emailAuth.sendCode(userId, dto);
  }

  /** 校验一次性验证码并绑定邮箱；不覆盖已有邮箱 */
  @Post('bind')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBody({ type: EmailBindDto })
  @ApiNoContentResponse({ description: '邮箱绑定成功' })
  bind(@UserId() userId: number, @Body() dto: EmailBindDto): Promise<void> {
    return this.emailAuth.bind(userId, dto);
  }

  /** 解绑当前认证账号的邮箱，不改变登录身份 */
  @Post('unbind')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({ description: '邮箱已解绑' })
  unbind(@UserId() userId: number): Promise<void> {
    return this.emailAuth.unbind(userId);
  }
}
