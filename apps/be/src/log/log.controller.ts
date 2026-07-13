import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBody,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Auth, UserId } from '../auth/auth.guard';
import { CreateLogDto } from './dto/create-log.dto';
import { LogIdDto } from './dto/log-id.dto';
import { LogListDto } from './dto/log-list.dto';
import { LogDto } from './dto/log.dto';
import { LogService } from './log.service';
import { UpdateLogDto } from './dto/update-log.dto';

@ApiTags('log')
@Controller('log')
export class LogController {
  constructor(private readonly logService: LogService) {}

  /** 创建一条 log */
  @Auth()
  @Post('create')
  @ApiBody({ type: CreateLogDto })
  @ApiOkResponse({ type: LogDto, description: '创建成功，返回新记录' })
  create(@UserId() userId: number, @Body() dto: CreateLogDto): Promise<LogDto> {
    return this.logService.create(userId, dto);
  }

  /** 公开列表：所有人可见的 PUBLIC log，无需登录 */
  @Post('list-public')
  @ApiBody({ type: LogListDto })
  @ApiOkResponse({ type: [LogDto], description: '公开 Log 列表' })
  listPublic(@Body() dto: LogListDto): Promise<LogDto[]> {
    return this.logService.listPublic(dto);
  }

  /** 我的列表：当前用户的全部 log */
  @Auth()
  @Post('list-mine')
  @ApiBody({ type: LogListDto })
  @ApiOkResponse({ type: [LogDto], description: '我的 Log 列表' })
  listMine(
    @UserId() userId: number,
    @Body() dto: LogListDto,
  ): Promise<LogDto[]> {
    return this.logService.listMine(userId, dto);
  }

  /** 获取单条：公开 log 无需登录，私有 log 仅本人可见 */
  @Post('get')
  @ApiBody({ type: LogIdDto })
  @ApiOkResponse({ type: LogDto, description: 'Log 详情' })
  get(
    @UserId() userId: number | undefined,
    @Body() dto: LogIdDto,
  ): Promise<LogDto> {
    return this.logService.get(userId, dto.id);
  }

  /** 更新（仅本人） */
  @Auth()
  @Post('update')
  @ApiBody({ type: UpdateLogDto })
  @ApiOkResponse({ type: LogDto, description: '更新后的 Log' })
  update(@UserId() userId: number, @Body() dto: UpdateLogDto): Promise<LogDto> {
    return this.logService.update(userId, dto);
  }

  /** 删除（仅本人） */
  @Auth()
  @Post('delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBody({ type: LogIdDto })
  @ApiNoContentResponse({ description: '删除成功' })
  delete(@UserId() userId: number, @Body() dto: LogIdDto): Promise<void> {
    return this.logService.delete(userId, dto.id);
  }
}
