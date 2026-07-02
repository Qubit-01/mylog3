import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Auth, UserId } from '../auth/auth.guard';
import { PublicUserDto } from './dto/public-user.dto';
import { UserService } from './user.service';

@ApiTags('user')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  /** 拉当前登录用户信息（前端启动/刷新时用来恢复登录态） */
  @Auth()
  @Get('me')
  @ApiOkResponse({ type: PublicUserDto, description: '当前登录用户公开信息' })
  me(@UserId() userId: number): Promise<PublicUserDto> {
    return this.userService.findPublicById(userId);
  }
}
