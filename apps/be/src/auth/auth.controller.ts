import { Body, Controller, Post } from '@nestjs/common';
import { ApiBody, ApiCreatedResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { PublicUserDto } from '../user/dto/public-user.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /** 注册账号 */
  @Post('register')
  @ApiBody({ type: RegisterDto })
  @ApiCreatedResponse({
    type: PublicUserDto,
    description: '注册成功，返回新用户公开信息',
  })
  register(@Body() dto: RegisterDto): Promise<PublicUserDto> {
    return this.authService.register(dto);
  }
}
