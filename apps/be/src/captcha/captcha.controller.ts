import { Controller, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiTags } from '@nestjs/swagger';
import { CaptchaService } from './captcha.service';
import { CaptchaCreateDto } from './dto/captcha-create.dto';

@ApiTags('captcha')
@Controller('captcha')
export class CaptchaController {
  constructor(private readonly captcha: CaptchaService) {}

  /** 生成图形验证码 */
  @Post('create')
  @ApiCreatedResponse({
    type: CaptchaCreateDto,
    description: '生成一次性图形验证码',
  })
  create(): CaptchaCreateDto {
    return this.captcha.generate();
  }
}
