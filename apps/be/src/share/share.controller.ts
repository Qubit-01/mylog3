import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Auth, UserId } from '../auth/auth.guard';
import { LogListResultDto } from '../log/dto/log-list.dto';
import { CreateShareDto, ShareTokenDto } from './dto/create-share.dto';
import { ShareListDto } from './dto/share-list.dto';
import { ShareService } from './share.service';

@ApiTags('share')
@Controller('share')
export class ShareController {
  constructor(private readonly shareService: ShareService) {}

  /** 创建 Log 分享 */
  @Auth()
  @Post('create')
  @ApiBody({ type: CreateShareDto })
  @ApiCreatedResponse({
    type: ShareTokenDto,
    description: '创建成功，返回加密分享凭证',
  })
  create(
    @UserId() userId: number,
    @Body() dto: CreateShareDto,
  ): Promise<ShareTokenDto> {
    return this.shareService.create(userId, dto);
  }

  /** 匿名读取分享中的 Log 列表 */
  @Post('list')
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: ShareListDto })
  @ApiOkResponse({ type: LogListResultDto, description: '分享 Log 列表' })
  list(@Body() dto: ShareListDto): Promise<LogListResultDto> {
    return this.shareService.list(dto);
  }
}
